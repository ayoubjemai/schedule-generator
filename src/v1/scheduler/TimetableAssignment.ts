import { Activity } from '../models/Activity';
import { Period } from '../types/core';
import { convertMinutesToHoursAndMinutes } from '../utils/convertMinutesToHoursAndMinutes';

type PeriodInMinutes = number;
type ActivityId = string;
type RoomId = string;
class TimetableAssignment {
  private activitySlots: Map<ActivityId, Period> = new Map(); // activityId -> Period
  private activityRooms: Map<ActivityId, RoomId> = new Map(); // activityId -> roomId

  // New data structures
  private timeIntervals: Map<PeriodInMinutes, Activity> = new Map(); // PeriodInMinutes -> Activity
  private roomTimeIntervals: Map<PeriodInMinutes, Activity> = new Map(); // roomId -> day -> IntervalTree

  constructor(
    private daysCount: number,
    private periodsPerDay: number,
    data?: {
      activitySlots: Map<string, Period>;
      activityRooms: Map<string, string>;
      timeIntervals: Map<PeriodInMinutes, Activity>;
      roomTimeIntervals: Map<PeriodInMinutes, Activity>;
    }
  ) {
    if (data) {
      this.activitySlots = data.activitySlots;
      this.activityRooms = data.activityRooms;
      this.timeIntervals = data.timeIntervals || new Map();
      this.roomTimeIntervals = data.roomTimeIntervals || new Map();
    }
  }

  assignActivity(activity: Activity, period: Period, roomId: string): boolean {
    const periodInMinutes = IntervalTree.periodToMinutes(period);

    this.timeIntervals.set(periodInMinutes, activity);
    this.roomTimeIntervals.set(periodInMinutes, activity);

    this.activitySlots.set(activity.id, period);
    this.activityRooms.set(activity.id, roomId);

    return true;
  }

  removeActivity(activity: Activity): void {
    const period = this.activitySlots.get(activity.id);
    const roomId = this.activityRooms.get(activity.id);

    if (!period || !roomId) return;

    const periodInMinutes = IntervalTree.periodToMinutes(period);
    this.timeIntervals.delete(periodInMinutes);
    this.roomTimeIntervals.delete(periodInMinutes);
    this.activitySlots.delete(activity.id);
    this.activityRooms.delete(activity.id);
  }

  getSlotForActivity(activityId: string): Period | undefined {
    return this.activitySlots.get(activityId);
  }

  getRoomForActivity(activityId: string): string | undefined {
    return this.activityRooms.get(activityId);
  }

  getActivityAtSlot(slot: Period): Activity | undefined {
    const PeriodInMinutes = IntervalTree.periodToMinutes(slot);
    return this.timeIntervals.get(PeriodInMinutes);
  }

  getActivityInRoomAtSlot(roomId: string, day: number, hour: number, minute: number): Activity | undefined {
    const period: Period = { day, hour, minute };
    const periodInMinutes = IntervalTree.periodToMinutes(period);
    const activity = this.roomTimeIntervals.get(periodInMinutes);
    return activity;
  }

  getActivitiesForTeacher(teacherId: string): Activity[] {
    const activities: Activity[] = [];

    // For each assigned activity, check if the teacher is involved
    for (const [activityId] of this.activitySlots) {
      const activity = this.getActivityById(activityId);
      if (activity && activity.teachers.some(t => t.id === teacherId)) {
        activities.push(activity);
      }
    }

    return activities;
  }

  getActivitiesForStudentSet(studentSetId: string): Activity[] {
    const activities: Activity[] = [];

    // For each assigned activity, check if the student set is involved
    for (const [activityId] of this.activitySlots) {
      const activity = this.getActivityById(activityId);
      if (activity && activity.studentSets.some(s => s.id === studentSetId)) {
        activities.push(activity);
      }
    }

    return activities;
  }

  getAllActivityAssignments(): Activity[] {
    return Array.from(this.timeIntervals.values());
  }

  getAllActivitiesInRoom(roomId: string): Activity[] {
    const assignedActivityRooms = this.activityRooms;

    const activities: Activity[] = [];
    for (const [activityId, room] of assignedActivityRooms) {
      if (room === roomId) {
        const activity = this.getActivityById(activityId);
        if (activity) {
          activities.push(activity);
        }
      }
    }

    return activities;
  }

  private getActivityById(activityId: string): Activity | undefined {
    const activities = this.getAllActivityAssignments();
    return activities.find(activity => activity.id === activityId);
  }

  public clone(): TimetableAssignment {
    return new TimetableAssignment(this.daysCount, this.periodsPerDay, {
      activityRooms: this.activityRooms,
      activitySlots: this.activitySlots,
      timeIntervals: this.timeIntervals,
      roomTimeIntervals: this.roomTimeIntervals,
    });
  }
}

class IntervalTree {
  private intervals: Array<{ start: number; end: number; value: Activity }> = [];

  insert(period: Period, totalDuraionInMinutes: number, value: Activity): void {
    const start = IntervalTree.periodToMinutes(period);
    const end = start + totalDuraionInMinutes;

    this.intervals.push({ start, end, value });
  }

  remove(activity: Activity): void {
    this.intervals = this.intervals.filter(interval => interval.value.id !== activity.id);
    return;
  }

  getAll(): Activity[] {
    return this.intervals.map(interval => interval.value);
  }

  getActivityAtTime(period: Period): Activity | undefined {
    const time = IntervalTree.periodToMinutes(period);
    const interval = this.intervals.find(interval => interval.start <= time && interval.end >= time);
    return interval ? interval.value : undefined;
  }
  static periodToMinutes(period: Period): number {
    return period.day * 24 * 60 + period.hour * 60 + period.minute;
  }
}

export { TimetableAssignment };
