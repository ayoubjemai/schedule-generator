import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { StudentSet } from '../../../../models/StudentSet';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MinHoursContinouslyInActivityTag } from '../../common/MinHoursContinouslyInActivityTag/MinHoursContinouslyInActivityTag';

export class StudentSetMinHoursContinouslyInActivityTag
  extends MinHoursContinouslyInActivityTag
  implements Constraint
{
  type = ConstraintType.time.studentSet.StudentSetMinHoursContinouslyInActivityTag;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];

  constructor(
    studentSet: StudentSet,
    protected minHours: number,
    protected activityTagId: string,
    protected MIN_GAP_MINUTES: number = 5,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(minHours, activityTagId);
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

    return this.isValid(assignment, studentSetActivities, this.addActivity.bind(this), this.MIN_GAP_MINUTES);
  }
}
