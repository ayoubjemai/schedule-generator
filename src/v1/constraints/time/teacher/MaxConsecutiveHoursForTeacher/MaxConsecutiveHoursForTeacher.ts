import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Teacher } from '../../../../models/Teacher';
import { Constraint } from '../../../../types/constraints';
import { convertMinutesToHoursAndMinutes } from '../../../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';
import { Activity } from '../../../../models/Activity';

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
    let consecutiveHours = 0;

    for (const activity of teacherActivities) {
      this.addActivity(activity);
      const { totalDurationInMinutes } = activity;
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;
      for (let durationInMinutes = 0; durationInMinutes < totalDurationInMinutes; durationInMinutes++) {
        const { hours, minutes } = convertMinutesToHoursAndMinutes(durationInMinutes);

        const hour = slot.hour + hours;
        const minute = slot.minute + minutes;
        if (assignment.getActivityAtSlot({ day: slot.day, hour, minute })) {
          consecutiveHours++;
        } else {
          consecutiveHours = 0; // Reset if there's a gap
        }
      }
    }
    if (consecutiveHours > this.maxHours) {
      return false; // Exceeds max consecutive hours
    }

    return true;
  }
}

export { MaxConsecutiveHoursForTeacher };
