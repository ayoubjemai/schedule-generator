import { Activity } from '../../../models/Activity';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';

export class MinConsecutiveHoursForTeacher implements Constraint {
  type = ConstraintType.time.teacher.MinConsecutiveHoursForTeacher;
  private teacher: Teacher;
  private MIN_GAP_MINUTES: number;
  activities: Activity[] = [];

  constructor(
    teacher: Teacher,
    private minConsecutiveHours: number,
    public weight = DEFAULT_WEIGHT,
    public active = true
  ) {
    this.teacher = teacher;
    this.MIN_GAP_MINUTES = 0; //|| teacher.minGapsPerDay;
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    const teacherActivitiesByDay: Record<number, { activity: Activity; slot: Period }[]> =
      teacherActivities.reduce((acc, activity) => {
        this.addActivity(activity);
        const slot = assignment.getSlotForActivity(activity.id);
        if (!slot) return acc;
        if (!acc[slot.day]) {
          acc[slot.day] = [];
        }
        acc[slot.day].push({ activity, slot });
        return acc;
      }, {} as Record<number, { activity: Activity; slot: Period }[]>);

    let maxConsecutiveReached: boolean = false;
    for (const teacherActivitiesDay of Object.entries(teacherActivitiesByDay)) {
      const [_, teacherActivities] = teacherActivitiesDay;
      const durations = this.calculateTotalDurations(teacherActivities);
      maxConsecutiveReached = durations.every(duration => duration >= this.minConsecutiveHours * 60);
    }

    return maxConsecutiveReached;
  }

  private calculateTotalDurations(activities: { activity: Activity; slot: Period }[]): number[] {
    if (activities.length === 0) return [];

    const sortedActivities = this.sortActivitiesByTime([...activities]);

    const totalDurations: number[] = [];
    let currentGroupDuration = sortedActivities[0].activity.totalDurationInMinutes;
    let previousEndTime = this.getEndTimeInMinutes(sortedActivities[0]);

    for (let i = 1; i < sortedActivities.length; i++) {
      const currentActivity = sortedActivities[i];
      const currentStartTime = this.getStartTimeInMinutes(currentActivity);

      const gap = currentStartTime - previousEndTime;

      if (gap <= this.MIN_GAP_MINUTES) {
        currentGroupDuration += currentActivity.activity.totalDurationInMinutes;
      } else {
        totalDurations.push(currentGroupDuration);
        currentGroupDuration = currentActivity.activity.totalDurationInMinutes;
      }

      previousEndTime = this.getEndTimeInMinutes(currentActivity);
    }

    totalDurations.push(currentGroupDuration);

    return totalDurations;
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

  private getEndTimeInMinutes(activity: { activity: Activity; slot: Period }): number {
    return this.getStartTimeInMinutes(activity) + activity.activity.totalDurationInMinutes;
  }

  setMinGapMinutes(minutes: number): void {
    if (minutes < 0) throw new Error('Minimum gap cannot be negative');
    this.MIN_GAP_MINUTES = minutes;
  }
}
