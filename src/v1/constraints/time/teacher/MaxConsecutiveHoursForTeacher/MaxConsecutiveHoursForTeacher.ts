import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Teacher } from '../../../../models/Teacher';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { MaxConsecutiveHours } from '../../common/MaxConsectiveHours/MaxConsecutiveHours';

class MaxConsecutiveHoursForTeacher extends MaxConsecutiveHours implements Constraint {
  type = ConstraintType.time.teacher.MaxConsecutiveHoursForTeacher;
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxHours: number;
  activities: Activity[] = [];

  constructor(teacher: Teacher, maxHours: number, weight = DEFAULT_WEIGHT, active = true) {
    const minGapBetweenActivity = 0; // For MaxConsecutiveHoursForTeacher, use 0 gap minutes to consider activities "consecutive" only if they're back-to-back
    super(maxHours, minGapBetweenActivity);
    this.teacher = teacher;
    this.maxHours = maxHours;
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

    teacherActivities.forEach(activity => this.addActivity(activity));

    return this.isValid(assignment, this.activities);
  }
}

export { MaxConsecutiveHoursForTeacher };
