// filepath: /generate-schedule/generate-schedule/src/types/core.ts
export interface Period {
  day: number;
  hour: number;
}

export interface TimeConstraint {
  type: string;
  weight: number; // 0-100% importance
  active: boolean;
  isSatisfied(assignment: TimetableAssignment): boolean;
}

export interface SpaceConstraint {
  type: string;
  weight: number; // 0-100% importance
  active: boolean;
  isSatisfied(assignment: TimetableAssignment): boolean;
}