import { Activity } from '../../models/Activity';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';

export class PreferredStartingTimesForActivity implements Constraint {
  type = 'PreferredStartingTimesForActivity';
  weight: number;
  active: boolean;
  activity: Activity;
  preferredTimes: Period[];

  constructor(activity: Activity, preferredTimes: Period[], weight = 50, active = true) {
    this.activity = activity;
    this.preferredTimes = preferredTimes;
    this.weight = weight;
    this.active = active;
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
