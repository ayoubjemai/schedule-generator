import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Teacher } from '../../../../models/Teacher';
import { Period } from '../../../../types/core';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MinHoursContinouslyInActivityTag } from '../../common/MinHoursContinouslyInActivityTag/MinHoursContinouslyInActivityTag';

export class TeacherMinHourContinouslyInActivityTag
  extends MinHoursContinouslyInActivityTag
  implements Constraint
{
  type = ConstraintType.time.teacher.TeacherMinHourContinouslyInActivityTag;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(
    teacher: Teacher,
    protected minHoursDaily: number,
    protected activityTagId: string,
    protected MIN_GAP_MINUTES = 0,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(minHoursDaily, activityTagId);
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    return this.isValid(assignment, teacherActivities, this.addActivity.bind(this), this.MIN_GAP_MINUTES);
  }
}
