import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Room } from '../../../../models/Room';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { StudentSet } from '../../../../../v0/main';
import { MaxHoursPerDay } from '../../common/MaxHoursPerDay/MaxHoursPerDay';

export class StudentSetMaxHoursPerDay extends MaxHoursPerDay implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMaxGapPerDay;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(studentSet: StudentSet, maxHourPerDay: number, weight = DEFAULT_WEIGHT, active = true) {
    super(maxHourPerDay);
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
