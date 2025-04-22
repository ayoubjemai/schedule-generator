import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { MinDaysPerWeek } from '../../common/MinDaysPerWeek/MinDaysPerWeek';

export class StudentSetMinDaysPerWeek extends MinDaysPerWeek implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMinDaysPerWeek;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(
    studentSet: StudentSet,
    protected minDayPerWeek: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(minDayPerWeek);
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

    studentSetActivities.forEach(activitiy => this.addActivity(activitiy));

    return this.isValid(assignment, this.activities);
  }
}
