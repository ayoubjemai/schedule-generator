import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
import { ConstraintType } from '../../../constraintType.enum';
import { MaxHoursContinouslyInActivityTag } from '../../common/MaxHoursContinouslyInActivityTag/MaxHoursContinouslyInActivityTag';
class TeacherMaxHoursContinouslyInActivityTag extends MaxHoursContinouslyInActivityTag implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxHoursContinouslyInActivityTag;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];
  protected MIN_GAP_MINUTES: number;
  constructor(
    teacher: Teacher,
    protected activityTagId: string,
    protected maxHourContinously: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    super(maxHourContinously, activityTagId);
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.MIN_GAP_MINUTES = teacher.get('minGapsPerDay') || 0;
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
export { TeacherMaxHoursContinouslyInActivityTag };
