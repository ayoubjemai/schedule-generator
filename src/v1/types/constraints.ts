import { TimetableAssignment } from '../scheduler/TimetableAssignment';

export interface Constraint {
  type: string;
  weight: number; // 0-100% importance
  active: boolean;
  isSatisfied(assignment: TimetableAssignment): boolean;
}

// export interface SpaceConstraint {
//   type: string;
//   weight: number; // 0-100% importance
//   active: boolean;
//   isSatisfied(assignment: TimetableAssignment): boolean;
// }
