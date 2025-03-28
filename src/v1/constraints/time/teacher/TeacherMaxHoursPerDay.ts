import moment from 'moment';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';

export class TeacherMaxHoursPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxHoursPerDay;

  constructor(
    private teacher: Teacher,
    private maxMinutesPerDay: number,
    public weight = DEFAULT_WEIGHT,
    public active = true
  ) {}

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    const teacherDailyDurationInMinutes = new Map<number, number>();

    for (const { id, totalDurationInMinutes } of teacherActivities) {
      const slot = assignment.getSlotForActivity(id);
      if (!slot) {
        console.log('Cannot find period with activityId' + id);
        continue;
      }
      const periodPerDay = teacherDailyDurationInMinutes.get(slot.day);
      teacherDailyDurationInMinutes.set(slot.day, (periodPerDay || 0) + totalDurationInMinutes);
    }
    let isSatisfied = true;
    teacherDailyDurationInMinutes.forEach(schedule => {
      if (schedule > this.maxMinutesPerDay) {
        isSatisfied = false;
      }
    });

    return isSatisfied;
  }
}
