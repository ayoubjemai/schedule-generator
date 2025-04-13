import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

class TeacherNotAvailablePeriods implements Constraint {
  type = ConstraintType.time.teacher.TeacherNotAvailablePeriods;
  weight: number;
  active: boolean;
  teacher: Teacher;
  periods: Period[];
  activities: Activity[] = [];

  constructor(teacher: Teacher, weight = DEFAULT_WEIGHT, active = true) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.periods = [...(teacher.get('notAvailablePeriods') || [])];
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    for (const activity of teacherActivities) {
      this.addActivity(activity);
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;
      const { totalDurationInMinutes } = activity;

      const startActivityInMinutes = ActivityHelper.getStartTimeInMinutes({ slot });
      const endActivityInMinutes = ActivityHelper.getEndTimeInMinutes({ slot, activity });
      const periodInMinuts = this.periods.map(p => ActivityHelper.getStartTimeInMinutes({ slot: p }));

      const isNotAvailable = periodInMinuts.some(period => {
        return period >= startActivityInMinutes && period <= endActivityInMinutes;
      });
      if (isNotAvailable) return false;
    }

    return true;
  }
}

export { TeacherNotAvailablePeriods };
