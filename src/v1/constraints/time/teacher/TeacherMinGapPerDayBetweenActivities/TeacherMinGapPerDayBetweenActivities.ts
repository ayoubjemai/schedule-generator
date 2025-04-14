import moment from 'moment';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { ActivityHelper } from '../../../../../helpers/activity.helper';

export class TeacherMinGapPerDayBetweenActivities implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinGapPerDayBetweenActivities;
  activities: Activity[] = [];

  constructor(
    private teacher: Teacher,
    private minGapInMinutes: number,
    public weight = DEFAULT_WEIGHT * 0.1,
    public active = true
  ) {}
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    const teacherDailySchedules = new Map<number, { period: Period; totalDurationInMinutes: number }[]>();
    for (const activity of teacherActivities) {
      const { id, totalDurationInMinutes } = activity;
      this.addActivity(activity);
      const slot = assignment.getSlotForActivity(id)!;

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
    const start1 = ActivityHelper.getStartTimeInMinutes({ slot: period1 });

    const end1 = ActivityHelper.getEndTimeInMinutes({
      activity: { totalDurationInMinutes: period1.totalDurationInMinutes },
      slot: period1,
    });

    const start2 = ActivityHelper.getStartTimeInMinutes({ slot: period2 });
    const end2 = ActivityHelper.getEndTimeInMinutes({
      activity: { totalDurationInMinutes: period2.totalDurationInMinutes },
      slot: period2,
    });

    // Ensure we compare in order (earlier period first)

    if (start1 < start2) {
      return start2 - end1;
    }
    return start1 - end2;
  }
}
