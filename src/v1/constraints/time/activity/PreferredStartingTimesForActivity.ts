import { Activity } from '../../../models/Activity';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';

export class PreferredStartingTimesForActivity implements Constraint {
  type = ConstraintType.time.activity.PreferredStartingTimesForActivity;
  weight: number;
  active: boolean;
  activity: Activity;
  preferredTimes: Period[];
  activities: Activity[] = [];

  constructor(activity: Activity, preferredTimes: Period[], weight = DEFAULT_WEIGHT * 0.5, active = true) {
    this.activity = activity;
    this.preferredTimes = preferredTimes;
    this.weight = weight;
    this.active = active;
    this.addActivity(activity);
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.preferredTimes.length === 0) return true;

    const assignedSlot = assignment.getSlotForActivity(this.activity.id);
    if (!assignedSlot) return true; // Not yet assigned

    return this.preferredTimes.some(
      preferredTime =>
        preferredTime.day === assignedSlot.day &&
        preferredTime.hour === assignedSlot.hour &&
        preferredTime.minute === assignedSlot.minute
    );
  }
}
