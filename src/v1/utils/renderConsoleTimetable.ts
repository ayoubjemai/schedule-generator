import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';
import { logToFile } from './logToFile';
import { Activity } from '../models/Activity';
import { convertMinutesToHoursAndMinutes } from './helper';

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
        totalDurationInMinutes: number;
      }[],
    };

    let activity: Activity | undefined;
    for (let hour = 0; hour < periodsPerDay; hour++) {
      for (let min = 0; min < 60; min++) {
        activity = assignment.getActivityAtSlot({ day, hour, minute: min });
        if (activity) break;
      }

      if (activity) {
        const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
        const roomId = assignment.getRoomForActivity(activity.id);
        daySchedule.periods.push({
          hour: hours,
          activity: activity.name,
          room: roomId || null,
          minute: minutes,
          totalDurationInMinutes: activity.totalDurationInMinutes,
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
    timetable.push(daySchedule);
  }
  //  console.log(JSON.stringify(timetable, null, 2)); // Log the JSON object to the terminal

  logToFile('timetable', timetable);
}
