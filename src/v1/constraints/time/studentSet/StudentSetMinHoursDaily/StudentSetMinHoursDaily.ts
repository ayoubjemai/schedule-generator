import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { MinHoursDaily } from '../../common/MinHoursDaily/MinHoursDaily';

const warnedStudentSets: Record<string, 1 | undefined> = {};

export class StudentSetMinHoursDaily extends MinHoursDaily implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetMinHoursDaily;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(
    studentSet: StudentSet,
    protected minHoursDaily: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(minHoursDaily);
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

    const allStudentSetDurationInMinutes = studentSetActivities.reduce((acc, activity) => {
      return acc + activity.totalDurationInMinutes;
    }, 0);

    const minDuration = this.minHoursDaily * 60;
    if (allStudentSetDurationInMinutes < minDuration) {
      if (!warnedStudentSets[this.studentSet.id]) {
        console.warn(
          `Student set ${this.studentSet.name} has only ${allStudentSetDurationInMinutes} minutes of activities, but needs at least ${minDuration} minutes.`
        );
        warnedStudentSets[this.studentSet.id] = 1;
      }
      return false;
    }

    studentSetActivities.forEach(activity => {
      this.addActivity(activity);
    });
    return this.isValid(assignment, studentSetActivities);
  }
}
