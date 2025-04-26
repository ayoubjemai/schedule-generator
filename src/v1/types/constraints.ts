import { Activity } from '../models/Activity';
import { TimetableAssignment } from '../scheduler/TimetableAssignment';
export interface Constraint {
  type: string;
  weight: number; 
  active: boolean;
  activities: Activity[];
  isSatisfied(assignment: TimetableAssignment): boolean;
  addActivity(activity: Activity): void;
}
