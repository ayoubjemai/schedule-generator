import moment from 'moment';
import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

export class StudentSetNotOverlapping implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetNotOverlapping;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(studentSet: StudentSet, weight = DEFAULT_WEIGHT, active = true) {
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

    for (let i = 0; i < studentSetActivities.length; i++) {
      const activityA = studentSetActivities[i];
      for (let j = i + 1; j < studentSetActivities.length; j++) {
        const activityB = studentSetActivities[j];
        if (activityA.id === activityB.id) continue;
        if (this.checkActivityOverlap(assignment, activityA, activityB)) {
          return false;
        }
      }
    }

    return true; // Return true if constraint is satisfied
  }
  private checkActivityOverlap(
    assignment: TimetableAssignment,
    activityA: Activity,
    activityB: Activity
  ): boolean {
    const slotA = assignment.getSlotForActivity(activityA.id);
    const slotB = assignment.getSlotForActivity(activityB.id);

    if (!slotA || !slotB) return false;

    const baseDate = moment().startOf('week');

    const startA = moment(baseDate)
      .add(slotA.day, 'days')
      .add(slotA.hour, 'hours')
      .add(slotA.minute, 'minutes');

    const endA = startA.clone().add(activityA.totalDurationInMinutes, 'minutes');

    const startB = moment(baseDate)
      .add(slotB.day, 'days')
      .add(slotB.hour, 'hours')
      .add(slotB.minute, 'minutes');

    const endB = startB.clone().add(activityB.totalDurationInMinutes, 'minutes');
    return startA.isBefore(endB) && startB.isBefore(endA);
  }
}
