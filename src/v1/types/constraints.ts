import { TimetableAssignment } from '../scheduler/TimetableAssignment';

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
