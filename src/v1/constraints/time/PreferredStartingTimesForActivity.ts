import { Activity } from '../../models/Activity';
import { Period, TimeConstraint } from '../../models/interfaces';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';

export class PreferredStartingTimesForActivity implements TimeConstraint {
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
      preferredTime => preferredTime.day === assignedSlot.day && preferredTime.hour === assignedSlot.hour
    );
  }
}
