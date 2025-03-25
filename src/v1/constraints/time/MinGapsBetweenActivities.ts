import moment from 'moment';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';

export class MinGapsBetweenActivities implements Constraint {
  type = 'MinGapsBetweenActivities';

  constructor(private minGapInMinutes: number, public weight = 100, public active = true) {}

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const activities = assignment.getAllActivityAssignments();

    for (let i = 0; i < activities.length; i++) {
      const activityA = activities[i];
      const slotA = assignment.getSlotForActivity(activityA.id);

      if (!slotA) continue;

      for (let j = i + 1; j < activities.length; j++) {
        const activityB = activities[j];
        const slotB = assignment.getSlotForActivity(activityB.id);

        if (!slotB) continue;
        const gap = Math.abs(moment(slotA).diff(moment(slotB), 'minutes'));
        //const gap = Math.abs(slotA.hour - slotB.hour);
        if (gap < this.minGapInMinutes) {
          return false;
        }
      }
    }

    return true;
  }
}
