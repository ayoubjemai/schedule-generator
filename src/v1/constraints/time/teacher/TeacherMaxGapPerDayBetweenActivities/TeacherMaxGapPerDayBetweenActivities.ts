import moment from 'moment';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { MaxGapPerDay } from '../../common/MaxGapPerDay/MaxGapPerDay';

export class TeacherMaxGapPerDayBetweenActivities extends MaxGapPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxGapPerDayBetweenActivities;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    protected maxGapInMinutes: number,
    public weight = DEFAULT_WEIGHT * 0.1,
    public active = true
  ) {
    super(maxGapInMinutes);
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });
    return this.isValid(assignment, teacherActivities);
  }

  // private getGapBetweenPeriods(
  //   period1: Period & { totalDurationInMinutes: number },
  //   period2: Period & { totalDurationInMinutes: number }
  // ): number {
  //   const start1 = moment().day(period1.day).hour(period1.hour).minute(period1.minute).second(0);
  //   const end1 = start1.clone().add(period1.totalDurationInMinutes, 'minutes');

  //   const start2 = moment().day(period2.day).hour(period2.hour).minute(period2.minute).second(0);
  //   const end2 = start2.clone().add(period2.totalDurationInMinutes, 'minutes');

  //   // Ensure we compare in order (earlier period first)
  //   if (end1.isBefore(start2)) {
  //     return start2.diff(end1, 'minutes');
  //   } else if (end2.isBefore(start1)) {
  //     return start1.diff(end2, 'minutes');
  //   } else {
  //     // Periods overlap, calculate the gap based on the overlap
  //     const overlapEnd = moment.max(end1, end2); // The later end time
  //     const overlapStart = moment.min(start1, start2); // The earlier start time
  //     return Math.abs(
  //       overlapEnd.diff(overlapStart, 'minutes') -
  //         (period1.totalDurationInMinutes + period2.totalDurationInMinutes)
  //     );
  //   }
  // }
}
