import moment from 'moment';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';

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
        if (activityB.id === activityA.id) continue;
        const slotB = assignment.getSlotForActivity(activityB.id);

        if (!slotB) continue;
        const gap = this.getGapBetweenPeriods(
          { ...slotA, totalDurationInMinutes: activityA.totalDurationInMinutes },
          { ...slotB, totalDurationInMinutes: activityB.totalDurationInMinutes }
        );

        if (gap < this.minGapInMinutes) {
          return false;
        }
      }
    }

    return true;
  }

  private getGapBetweenPeriods(
    period1: Period & { totalDurationInMinutes: number },
    period2: Period & { totalDurationInMinutes: number }
  ): number {
    const start1 = moment().day(period1.day).hour(period1.hour).minute(period1.minute).second(0);
    const end1 = start1.clone().add(period1.totalDurationInMinutes, 'minutes');

    const start2 = moment().day(period2.day).hour(period2.hour).minute(period2.minute).second(0);
    const end2 = start2.clone().add(period2.totalDurationInMinutes, 'minutes');

    // Ensure we compare in order (earlier period first)
    if (end1.isBefore(start2)) {
      return start2.diff(end1, 'minutes');
    } else if (end2.isBefore(start1)) {
      return start1.diff(end2, 'minutes');
    }

    // If they overlap, there's no gap
    return 0;
  }
}
