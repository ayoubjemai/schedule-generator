import moment from 'moment';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';
import { Activity } from '../../../models/Activity';

export class TeacherMaxMinutesPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxMinutesPerDay;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    private maxMinutesPerDay: number,
    public weight = DEFAULT_WEIGHT,
    public active = true
  ) {}
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    const teacherDailyDurationInMinutes = new Map<number, number>();

    for (const activity of teacherActivities) {
      const { id, totalDurationInMinutes } = activity;
      this.addActivity(activity);

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
