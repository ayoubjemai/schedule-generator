import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Teacher } from '../../../../models/Teacher';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';
import { ActivityHelper } from '../../../../../helpers/activity.helper';

class MaxConsecutiveHoursForTeacher implements Constraint {
  type = ConstraintType.time.teacher.MaxConsecutiveHoursForTeacher;
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxHours: number;
  activities: Activity[] = [];

  constructor(teacher: Teacher, maxHours: number, weight = DEFAULT_WEIGHT, active = true) {
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

    // Add activities to constraint's list
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });

    // Group activities by day
    const teacherActivitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, teacherActivities);

    // Check each day's activities for consecutive hours exceeding maximum
    for (const [_, dayActivities] of Object.entries(teacherActivitiesByDay)) {
      // For MaxConsecutiveHoursForTeacher, use 0 gap minutes to consider activities "consecutive" only if they're back-to-back
      const minGapMinutes = 0;

      // Calculate durations of consecutive activity groups
      const consecutiveDurations = ActivityHelper.calculateConsecutiveActivityDurations(
        dayActivities,
        minGapMinutes
      );

      // Convert minutes to hours and check if any exceed max hours
      for (const durationInMinutes of consecutiveDurations) {
        const durationInHours = durationInMinutes / 60;
        if (durationInHours > this.maxHours) {
          return false;
        }
      }
    }

    return true;
  }
}

export { MaxConsecutiveHoursForTeacher };
