import { Activity } from '../models/Activity';
import { TimetableAssignment } from '../scheduler/TimetableAssignment';

export interface Constraint {
  type: string;
  weight: number; // 0-100% importance
  active: boolean;
  activities: Activity[];
  isSatisfied(assignment: TimetableAssignment): boolean;
  addActivity(activity: Activity): void;
}

// export interface SpaceConstraint {
//   type: string;
//   weight: number; // 0-100% importance
//   active: boolean;
//   isSatisfied(assignment: TimetableAssignment): boolean;
// }
