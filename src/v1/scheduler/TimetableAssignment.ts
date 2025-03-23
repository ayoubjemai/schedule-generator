// filepath: /generate-schedule/generate-schedule/src/scheduler/TimetableAssignment.ts
import { Activity } from '../models/Activity';
import { Period } from '../types/core';
//import { convertMinutesToHoursAndMinutes } from '../utils/helper';

class TimetableAssignment {
  private activitySlots: Map<string, Period> = new Map(); // activityId -> Period
  private activityRooms: Map<string, string> = new Map(); // activityId -> roomId
  private timeMatrix: Map<string, Activity> = new Map(); // dayHour -> Activity mapping
  private roomTimeMatrix: Map<string, Activity> = new Map(); // roomDayHour -> Activity mapping

  constructor(private daysCount: number, private periodsPerDay: number) {}

  assignActivity(activity: Activity, period: Period, roomId: string): boolean {
    // Check if the slot is available

    for (let i = 0; i < activity.totalDurationInMinutes; i++) {
      const slotKey = `${period.day}_${period.hour * 60 + i}`;
      if (this.timeMatrix.has(slotKey)) return false;

      const roomSlotKey = `${roomId}_${period.day}_${period.hour * 60 + i}`;
      if (this.roomTimeMatrix.has(roomSlotKey)) return false;
    }

    // Assign the activity
    this.activitySlots.set(activity.id, period);
    this.activityRooms.set(activity.id, roomId);

    // Update the matrices
    for (let i = 0; i < activity.totalDurationInMinutes; i++) {
      const slotKey = `${period.day}_${period.hour * 60 + i}`;
      this.timeMatrix.set(slotKey, activity);

      const roomSlotKey = `${roomId}_${period.day}_${period.hour * 60 + i}`;
      this.roomTimeMatrix.set(roomSlotKey, activity);
    }

    return true;
  }

  removeActivity(activity: Activity): void {
    const period = this.activitySlots.get(activity.id);
    const roomId = this.activityRooms.get(activity.id);

    if (!period || !roomId) return;

    // Remove from matrices

    //const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
    for (let i = 0; i < activity.totalDurationInMinutes; i++) {
      //for (let min = 0; min < minutes; min++) {
      const slotKey = `${period.day}_${period.hour * 60 + i}`;
      this.timeMatrix.delete(slotKey);

      const roomSlotKey = `${roomId}_${period.day}_${period.hour * 60 + i}`;
      this.roomTimeMatrix.delete(roomSlotKey);
      //}
    }

    // Remove from maps
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
    const { day, hour, minute } = slot;
    const timeStamp = hour * 60 + minute;
    const slotKey = `${day}_${timeStamp}`;
    return this.timeMatrix.get(slotKey);
  }

  getActivityInRoomAtSlot(roomId: string, day: number, hour: number, minute: number): Activity | undefined {
    const timeStamp = hour * 60 + minute;
    const roomSlotKey = `${roomId}_${day}_${timeStamp}`;

    return this.roomTimeMatrix.get(roomSlotKey);
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
    const activities: Activity[] = [];
    for (const activity of this.timeMatrix.values()) {
      activities.push(activity);
    }
    return activities;
  }

  getAllActivitiesInRoom(roomId: string): Activity[] {
    const activities: Set<Activity> = new Set();

    // Collect all activities assigned to this room
    for (const [key, activity] of this.roomTimeMatrix.entries()) {
      if (key.startsWith(`${roomId}_`)) {
        activities.add(activity);
      }
    }

    return Array.from(activities);
  }

  private getActivityById(activityId: string): Activity | undefined {
    // This would require an activity repository in a real implementation
    // For now, we'll assume we can extract the activity from the matrices
    for (const activity of this.timeMatrix.values()) {
      if (activity.id === activityId) {
        return activity;
      }
    }
    return undefined;
  }

  public clone(): TimetableAssignment {
    return new TimetableAssignment(this.daysCount, this.periodsPerDay);
  }
}

export { TimetableAssignment };
