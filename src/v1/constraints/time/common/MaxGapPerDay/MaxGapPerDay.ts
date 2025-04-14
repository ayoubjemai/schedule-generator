import moment from 'moment';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';

export class MaxGapPerDay {
  constructor(protected maxGapInMinutes: number) {}
  isValid(assignment: TimetableAssignment, activities: Activity[]) {
    const activitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, activities);

    let isValid = true;
    Object.values(activitiesByDay).forEach(schedule => {
      for (let i = 0; i < schedule.length; i++) {
        const periodA = schedule[i];
        for (let j = i + 1; j < schedule.length; j++) {
          const periodB = schedule[j];

          const gapInMinutes = this.getGapBetweenPeriods(
            { ...periodA.slot, totalDurationInMinutes: periodA.activity.totalDurationInMinutes },
            { ...periodB.slot, totalDurationInMinutes: periodB.activity.totalDurationInMinutes }
          );

          if (gapInMinutes > this.maxGapInMinutes) {
            isValid = false;
            return false;
          }
        }
      }
    });
    return isValid;
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
    } else {
      // Periods overlap, calculate the gap based on the overlap
      const overlapEnd = moment.max(end1, end2); // The later end time
      const overlapStart = moment.min(start1, start2); // The earlier start time
      return Math.abs(
        overlapEnd.diff(overlapStart, 'minutes') -
          (period1.totalDurationInMinutes + period2.totalDurationInMinutes)
      );
    }
  }
}
