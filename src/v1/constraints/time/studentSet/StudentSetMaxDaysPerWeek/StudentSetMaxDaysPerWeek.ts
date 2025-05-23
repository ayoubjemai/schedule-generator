import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { StudentSet } from '../../../../models/StudentSet';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';

export class StudentSetMaxDaysPerWeek implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMaxDaysPerWeek;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(
    studentSet: StudentSet,
    private maxDaysPerWeek: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
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

    const studentActivityPerWeek = ActivityHelper.groupActivitiesByDay(assignment, studentSetActivities);

    const studentDaysNumber = Object.keys(studentActivityPerWeek).length;
    return studentDaysNumber <= this.maxDaysPerWeek;
  }
}
