import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

export class TeacherMinDaysPerWeek implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinDaysPerWeek;
  activities: Activity[] = [];
  constructor(
    private teacher: Teacher,
    private minDays: number,
    public weight = DEFAULT_WEIGHT * 0.2,
    public active = true
  ) {}
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    const workingDays = new Set<number>();

    for (const activity of teacherActivities) {
      this.addActivity(activity);
      const slot = assignment.getSlotForActivity(activity.id);
      if (slot) {
        workingDays.add(slot.day);
      }
    }

    return workingDays.size >= this.minDays;
  }
}
