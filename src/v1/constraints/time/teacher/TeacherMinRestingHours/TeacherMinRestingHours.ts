import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

class TeacherMinRestingHours implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinRestingHours;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(teacher: Teacher, private minRestHours: number, weight = DEFAULT_WEIGHT, active = true) {
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
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });

    const activitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, teacherActivities);

    // Get sorted days (0-6, representing days of week)
    const days = Object.keys(activitiesByDay)
      .map(Number)
      .sort((a, b) => a - b);

    for (let i = 0; i < days.length - 1; i++) {
      const currentDay = days[i];
      const nextDay = days[i + 1];

      // Skip if days aren't consecutive
      if (nextDay - currentDay !== 1) continue;

      // Get last activity of current day
      const currentDayActivities = activitiesByDay[currentDay];
      const lastActivityOfDay = ActivityHelper.sortActivitiesByTime(currentDayActivities).pop();

      // Get first activity of next day
      const nextDayActivities = activitiesByDay[nextDay];
      const firstActivityOfNextDay = ActivityHelper.sortActivitiesByTime(nextDayActivities)[0];
      if (!lastActivityOfDay || !firstActivityOfNextDay) continue;

      // Calculate rest hours (24 hours in a day)
      const endTimeMinutes = ActivityHelper.getEndTimeInMinutes(lastActivityOfDay);

      const startTimeMinutes = ActivityHelper.getStartTimeInMinutes(firstActivityOfNextDay);

      const restMinutes = startTimeMinutes - endTimeMinutes;
      const restHours = restMinutes / 60;

      if (restHours < this.minRestHours) return false;
    }

    return true;
  }
}

export { TeacherMinRestingHours };
