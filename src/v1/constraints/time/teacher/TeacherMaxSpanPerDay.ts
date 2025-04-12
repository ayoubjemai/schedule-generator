import { Activity } from '../../../models/Activity';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../utils/groupActivitiesByDay';
import { ValidationError } from '../../../utils/ValidationError';
import { ConstraintType } from '../../constraintType.enum';

class TeacherMaxSpanPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxSpanPerDay;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(teacher: Teacher, private maxSpanHours: number, weight = DEFAULT_WEIGHT, active = true) {
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
    const teacherActivitiesByDay: Record<number, { activity: Activity; slot: Period }[]> =
      groupActivitiesByDay(assignment, teacherActivities);

    let maxSpanReached = false;

    for (const activitieByDay of Object.entries(teacherActivitiesByDay)) {
      const [_, activities] = activitieByDay;
      if (activities.length === 0) continue;

      const sortedActivities = this.sortActivitiesByTime(activities);
      const firstActivitySlot = sortedActivities[0].slot;
      const lastActivity = sortedActivities[sortedActivities.length - 1];
      const lastActivitySlot = lastActivity.slot;
      const duration = this.getDurationInMinutes([
        firstActivitySlot,
        { ...lastActivitySlot, totalDuraionInMinutes: lastActivity.activity.totalDurationInMinutes },
      ]);

      this.checkDurationValidity(duration, sortedActivities, firstActivitySlot, lastActivitySlot);
      const maxSpan = this.maxSpanHours * 60;
      if (duration > maxSpan) {
        maxSpanReached = true;
        break;
      }
    }
    return !maxSpanReached;
  }

  private checkDurationValidity(
    duration: number,
    sortedActivities: { activity: Activity; slot: Period }[],
    firstActivitySlot: Period,
    lastActivitySlot: Period
  ) {
    if (duration < 0) {
      throw new ValidationError(
        `Invalid time period for activity ${sortedActivities[0].activity.name} (${firstActivitySlot.hour}:${firstActivitySlot.minute} - ${lastActivitySlot.hour}:${lastActivitySlot.minute})`
      );
    }
  }

  private sortActivitiesByTime(activities: { activity: Activity; slot: Period }[]): {
    activity: Activity;
    slot: Period;
  }[] {
    return activities.sort((a, b) => {
      const aTime = this.getStartTimeInMinutes(a);
      const bTime = this.getStartTimeInMinutes(b);
      return aTime - bTime;
    });
  }

  private getStartTimeInMinutes(activity: { activity: Activity; slot: Period }): number {
    return activity.slot.hour * 60 + activity.slot.minute;
  }

  private getDurationInMinutes(periods: [Period, Period & { totalDuraionInMinutes: number }]): number {
    const [start, end] = periods;
    return this.toMinutes(end) + end.totalDuraionInMinutes - this.toMinutes(start);
  }

  private toMinutes(p: Period): number {
    return p.day * 24 * 60 + p.hour * 60 + p.minute;
  }
}

export { TeacherMaxSpanPerDay };
