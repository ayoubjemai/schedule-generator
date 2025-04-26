import moment from 'moment';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { MaxHoursPerDay } from '../../common/MaxHoursPerDay/MaxHoursPerDay';
export class TeacherMaxMinutesPerDay extends MaxHoursPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxMinutesPerDay;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    protected maxMinutesPerDay: number,
    public weight = DEFAULT_WEIGHT,
    public active = true
  ) {
    super(maxMinutesPerDay);
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
}
