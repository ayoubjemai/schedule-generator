import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { MaxSpanPerDay } from '../../common/MaxSpanPerDay/MaxSpanPerDay';

export class StudentSetMaxSpanPerDay extends MaxSpanPerDay implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMaxSpanPerDay;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(
    studentSet: StudentSet,
    protected maxSpanHours: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(maxSpanHours);
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
