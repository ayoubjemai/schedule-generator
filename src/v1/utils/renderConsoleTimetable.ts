import { Activity } from '../models/Activity';
import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { logToFile } from './logToFile';

export function renderConsoleTimetable(
  assignment: TimetableAssignment,
  daysCount: number,
  periodsPerDay: number
): void {
  let timetable: {
    day: number;
    periods: {
      hour: number;
      minute: number;
      activity: string;
      room: string | null;
      totalDurationInMinutes: number;
      activityId: string;
      studentSetId: string;
      teacherId: string;
    }[];
  }[] = [];
  for (let day = 0; day < daysCount; day++) {
    timetable.push({
      day,
      periods: [] as {
        hour: number;
        minute: number;
        activity: string;
        room: string | null;
        totalDurationInMinutes: number;
        activityId: string;
        studentSetId: string;
        teacherId: string;
      }[],
    });
  }

  let activities = assignment.getAllActivityAssignments();
  // for (let hour = 0; hour <= periodsPerDay; hour++) {
  //   for (let min = 0; min < 60; min++) {
  //     activities = assignment.getActivityAtSlot({ day, hour, minute: min });
  //     if (activities) break;
  //   }

  activities.forEach(activity => {
    const roomId = assignment.getRoomForActivity(activity.id);
    const slot = assignment.getSlotForActivity(activity.id);
    if (!slot) throw new Error('Slot not found for activity ' + activity.name);
    const daySchedule = timetable.find(day => day.day === slot.day);
    if (!daySchedule) throw new Error('Day schedule not found for day ' + slot.day);
    if (daySchedule.periods.find(period => period.activityId === activity!.id)) return;
    daySchedule.periods.push({
      hour: slot.hour,
      activity: activity.name,
      room: roomId || null,
      minute: slot.minute,
      totalDurationInMinutes: activity.totalDurationInMinutes,
      activityId: activity.id,
      studentSetId: activity.studentSets[0].id,
      teacherId: activity.teachers[0].id,
    });
  });
  //}

  logToFile('timetable', timetable);
  logToFile('timetable', timetable, '/output');
}
