import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { StudentSet } from '../../../../models/StudentSet';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MaxHoursContinouslyInActivityTag } from '../../common/MaxHoursContinouslyInActivityTag/MaxHoursContinouslyInActivityTag';
export class StudentSetMaxHoursContinouslyInActivityTag
  extends MaxHoursContinouslyInActivityTag
  implements Constraint
{
  type = ConstraintType.time.studentSet.StudentSetMaxHoursContinouslyInActivityTag;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  activities: Activity[] = [];
  minGapPerDay: number;
  constructor(
    studentSet: StudentSet,
    protected MaxHoursContinously: number,
    protected activityTagId: string,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(MaxHoursContinously, activityTagId);
    this.studentSet = studentSet;
    this.weight = weight;
    this.active = active;
    this.minGapPerDay = studentSet.minGapsPerDay || 0;
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);
    return this.isValid(assignment, studentSetActivities, this.addActivity.bind(this), this.minGapPerDay);
  }
}
