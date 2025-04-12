import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

class TeacherMaxDayInIntervalHours implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxDayInIntervalHours;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(
    teacher: Teacher,
    private maxDays: number,
    private intervalStart: { hour: number; minute: number },
    private intervalEnd: { hour: number; minute: number },
    weight = DEFAULT_WEIGHT * 0.5,
    active = true
  ) {
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

    const intervalStartTimeStamp = this.intervalStart.hour * 60 + this.intervalStart.minute;
    const intervalEndTimeStamp = this.intervalEnd.hour * 60 + this.intervalEnd.minute;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });

    const activitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, teacherActivities);
    let daysInInterval = 0;

    for (const [_, activities] of Object.entries(activitiesByDay)) {
      const hasActivityInInterval = activities.some(({ slot, activity: { totalDurationInMinutes } }) => {
        const activityStart = slot.hour * 60 + slot.minute;
        const activityEnd = activityStart + totalDurationInMinutes;
        return activityStart < intervalEndTimeStamp && activityEnd > intervalStartTimeStamp;
      });

      if (hasActivityInInterval) {
        daysInInterval++;
      }

      if (daysInInterval > this.maxDays) return false;
    }

    return true;
  }
}

export { TeacherMaxDayInIntervalHours };
