import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';
import { logToFile } from './logToFile';

export function renderConsoleTimetable(
  assignment: TimetableAssignment,
  daysCount: number,
  periodsPerDay: number
): void {
  const timetable = [];

  for (let day = 0; day < daysCount; day++) {
    const daySchedule = {
      day: day + 1,
      periods: [] as {
        hour: number;
        minute: number;
        activity: string;
        room: string | null;
      }[],
    };

    for (let hour = 0; hour < periodsPerDay; hour++) {
      for (let min = 0; min < 60; min++) {
        const activity = assignment.getActivityAtSlot({ day, hour, minute: min });
        if (activity) {
          const roomId = assignment.getRoomForActivity(activity.id);
          daySchedule.periods.push({
            hour,
            activity: activity.name,
            room: roomId || null,
            minute: min,
          });
        } else {
          // daySchedule.periods.push({
          //   hour,
          //   activity: 'Free',
          //   room: null,
          //   minute: min,
          // });
        }
      }
    }

    timetable.push(daySchedule);
  }
  //  console.log(JSON.stringify(timetable, null, 2)); // Log the JSON object to the terminal

  logToFile('timetable', timetable);
}
