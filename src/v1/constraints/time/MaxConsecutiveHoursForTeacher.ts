// filepath: /generate-schedule/generate-schedule/src/constraints/time/MaxConsecutiveHoursForTeacher.ts
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Teacher } from '../../models/Teacher';
import { Constraint } from '../../types/constraints';
import { convertMinutesToHoursAndMinutes } from '../../utils/helper';

class MaxConsecutiveHoursForTeacher implements Constraint {
  type = 'MaxConsecutiveHoursForTeacher';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxHours: number;

  constructor(teacher: Teacher, maxHours: number, weight = 100, active = true) {
    this.teacher = teacher;
    this.maxHours = maxHours;
    this.weight = weight;
    this.active = active;
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    let consecutiveHours = 0;

    for (const activity of teacherActivities) {
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
