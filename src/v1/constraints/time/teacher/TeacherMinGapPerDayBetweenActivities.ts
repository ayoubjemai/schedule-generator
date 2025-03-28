import moment from 'moment';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';
import { Activity } from '../../../models/Activity';

export class TeacherMinGapPerDayBetweenActivities implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinGapPerDayBetweenActivities;

  constructor(
    private teacher: Teacher,
    private minGapInMinutes: number,
    public weight = DEFAULT_WEIGHT * 0.1,
    public active = true
  ) {}

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    const teacherDailySchedules = new Map<number, { period: Period; totalDurationInMinutes: number }[]>();

    for (const { id, totalDurationInMinutes } of teacherActivities) {
      const slot = assignment.getSlotForActivity(id);
      if (!slot) {
        console.log('Cannot find period with activityId' + id);
        continue;
      }
      const periodPerDay = teacherDailySchedules.get(slot.day);
      if (periodPerDay) {
        teacherDailySchedules.get(slot.day)?.push({ period: slot, totalDurationInMinutes });
      } else {
        teacherDailySchedules.set(slot.day, [{ period: slot, totalDurationInMinutes }]);
      }
    }
    let isSatisfied = true;
    teacherDailySchedules.forEach(schedule => {
      for (let i = 0; i < schedule.length; i++) {
        const periodA = schedule[i];
        for (let j = i + 1; j < schedule.length; j++) {
          const periodB = schedule[j];

          const gapInMinutes = this.getGapBetweenPeriods(
            { ...periodA.period, totalDurationInMinutes: periodA.totalDurationInMinutes },
            { ...periodB.period, totalDurationInMinutes: periodB.totalDurationInMinutes }
          );

          if (gapInMinutes < this.minGapInMinutes) {
            isSatisfied = false;
          }
        }
      }
    });

    return isSatisfied;
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
