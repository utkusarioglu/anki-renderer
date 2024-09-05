import type {
  Amplitude,
  Note,
  Waveform,
  DestinationNodes,
} from "./audio-synthesis.types.mts";

export class AudioSynthesis {
  private nodes: DestinationNodes[] = [];
  private base = 400;
  private context!: AudioContext;
  private equal = Array(13)
    .fill(this.base)
    .map((f, i) => f * 2 ** (i / 12));

  constructor(notes: Note[], duration: number) {
    this.constructMulti(notes, duration);
  }

  private constructMulti(notes: Note[], duration: number) {
    if (!this.context) {
      this.context = new window.AudioContext();
    }
    const amplitudeTotal = notes.reduce((a, c) => {
      a += c.amplitude;
      return a;
    }, 0);

    notes.forEach((note) => {
      this.constructSingle(
        // context,
        note.waveform,
        this.equal[note.step],
        note.amplitude / amplitudeTotal,
        duration,
      );
    });
  }

  private constructSingle(
    // context: AudioContext,
    waveform: Waveform,
    freq: number,
    amplitude: Amplitude,
    duration: number,
  ) {
    console.log({ waveform, freq, amplitude });
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    osc.connect(gain);
    gain.connect(this.context.destination);

    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.7;
    const startTime = this.context.currentTime + 0.1;

    gain.gain.linearRampToValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(amplitude, startTime + attackTime);
    gain.gain.linearRampToValueAtTime(
      sustainLevel * amplitude,
      startTime + attackTime + decayTime,
    );
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    this.nodes.push({
      osc,
      gain,
      startTime,
      duration,
    });
  }

  play() {
    this.nodes.forEach((node) => {
      node.osc.start(node.startTime);
    });
  }

  stop() {
    this.nodes.forEach((node) => {
      node.osc.stop();
      node.osc.disconnect(node.gain);
      node.gain.disconnect(this.context.destination);
      // @ts-expect-error
      delete node.gain;
      // @ts-expect-error
      delete node.osc;
    });

    this.context
      .close()
      .then(() => console.log("closed"))
      .catch(() => console.log("fail during close"));
  }
}
