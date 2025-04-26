import moment from 'moment';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MinGapPerDay } from '../../common/MinGapPerDay/MinGapPerDay';
export class TeacherMinGapPerDayBetweenActivities extends MinGapPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinGapPerDayBetweenActivities;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    protected minGapInMinutes: number,
    public weight = DEFAULT_WEIGHT * 0.85,
    public active = true
  ) {
    super(minGapInMinutes);
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
