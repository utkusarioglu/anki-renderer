import type { RankiCode } from "../config/config.types.mts";

interface ContentControlCodeAssignment {
  hljsName: string;
  displayName: string;
}

interface CodeAliasReturn extends ContentControlCodeAssignment {
  found: boolean;
}

type AssignmentsMap = Map<string, ContentControlCodeAssignment>;

export class ContentControl {
  private assignments: AssignmentsMap;

  constructor(aliases: RankiCode) {
    this.assignments = this._computeAssignments(aliases);
  }

  private _computeAssignments(aliases: RankiCode): AssignmentsMap {
    const assignments = new Map();
    Object.entries(aliases.aliases).forEach(
      ([hljsName, { list, displayName }]) => {
        list.forEach((alias) => {
          const lowercase = alias.toLowerCase();
          if (assignments.has(lowercase)) {
            throw new Error(`Code alias ${lowercase} assigned twice`);
          }
          assignments.set(lowercase, {
            hljsName,
            displayName,
          });
        });
      },
    );
    return assignments;
  }

  codeAlias(alias: string): CodeAliasReturn {
    const lowercase = alias.toLowerCase();
    const assigned = this.assignments.get(lowercase);
    if (assigned) {
      return {
        ...assigned,
        found: true,
      };
    }

    return {
      hljsName: lowercase,
      displayName: lowercase.slice(0, 1).toUpperCase() + alias.slice(1),
      found: false,
    };
  }
}
