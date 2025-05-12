import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Room } from '../../../../models/Room';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MaxHoursPerDay } from '../../common/MaxHoursPerDay/MaxHoursPerDay';
import { StudentSet } from '../../../../models/StudentSet';

export class StudentSetMaxHoursPerDay extends MaxHoursPerDay implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMaxHoursPerDay;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(studentSet: StudentSet, maxHourPerDay: number, weight = DEFAULT_WEIGHT, active = true) {
    super(maxHourPerDay * 60);
    this.studentSet = studentSet;
    this.weight = weight;
    this.active = active;
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);
    studentSetActivities.forEach(activity => {
      this.addActivity(activity);
    });

    return this.isValid(assignment, studentSetActivities);
  }
}
