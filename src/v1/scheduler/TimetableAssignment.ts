// filepath: /generate-schedule/generate-schedule/src/scheduler/TimetableAssignment.ts
import { Activity } from '../models/Activity';
import { Period } from '../types/core';

class TimetableAssignment {
  private activitySlots: Map<string, Period> = new Map(); // activityId -> Period
  private activityRooms: Map<string, string> = new Map(); // activityId -> roomId
  private timeMatrix: Map<string, Activity> = new Map(); // dayHour -> Activity mapping
  private roomTimeMatrix: Map<string, Activity> = new Map(); // roomDayHour -> Activity mapping

  constructor(private daysCount: number, private periodsPerDay: number) {}

  assignActivity(activity: Activity, period: Period, roomId: string): boolean {
    // Check if the slot is available
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}_${period.minute}`;
      if (this.timeMatrix.has(slotKey)) {
        return false; // Time slot already occupied
      }

      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}_${period.minute}`;
      if (this.roomTimeMatrix.has(roomSlotKey)) {
        return false; // Room already occupied at this time
      }
    }

    // Assign the activity
    this.activitySlots.set(activity.id, period);
    this.activityRooms.set(activity.id, roomId);

    // Update the matrices
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}_${period.minute}`;
      this.timeMatrix.set(slotKey, activity);

      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}_${period.minute}`;
      this.roomTimeMatrix.set(roomSlotKey, activity);
    }

    return true;
  }

  removeActivity(activity: Activity): void {
    const period = this.activitySlots.get(activity.id);
    const roomId = this.activityRooms.get(activity.id);

    if (!period || !roomId) return;

    // Remove from matrices
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}_${period.minute}`;
      this.timeMatrix.delete(slotKey);

      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}_${period.minute}`;
      this.roomTimeMatrix.delete(roomSlotKey);
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
    const slotKey = `${day}_${hour}_${minute}`;
    return this.timeMatrix.get(slotKey);
  }

  getActivityInRoomAtSlot(roomId: string, day: number, hour: number, minute: number): Activity | undefined {
    const roomSlotKey = `${roomId}_${day}_${hour}_${minute}`;
    return this.roomTimeMatrix.get(roomSlotKey);
  }

  getActivitiesForTeacher(teacherId: string): Activity[] {
    const activities: Activity[] = [];

    // For each assigned activity, check if the teacher is involved
    for (const [activityId, _] of this.activitySlots) {
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
    return Array.from(this.activitySlots.keys()).map(activityId => this.getActivityById(activityId)!);
  }

  getActivitiesInRoom(roomId: string): Activity[] {
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
}

export { TimetableAssignment };
