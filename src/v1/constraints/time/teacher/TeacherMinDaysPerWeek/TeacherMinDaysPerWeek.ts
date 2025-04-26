import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { MinDaysPerWeek } from '../../common/MinDaysPerWeek/MinDaysPerWeek';
export class TeacherMinDaysPerWeek extends MinDaysPerWeek implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinDaysPerWeek;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    protected minDays: number,
    public weight = DEFAULT_WEIGHT * 0.2,
    public active = true
  ) {
    super(minDays);
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    teacherActivities.forEach(activity => this.addActivity(activity));
    return this.isValid(assignment, teacherActivities);
  }
}
