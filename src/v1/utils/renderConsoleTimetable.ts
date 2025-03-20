import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';

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
        activity: string;
        room: string | null;
      }[],
    };

    for (let hour = 0; hour < periodsPerDay; hour++) {
      const activity = assignment.getActivityAtSlot(day, hour);
      if (activity) {
        const roomId = assignment.getRoomForActivity(activity.id);
        daySchedule.periods.push({
          hour,
          activity: activity.name,
          room: roomId || null,
        });
      } else {
        daySchedule.periods.push({
          hour,
          activity: 'Free',
          room: null,
        });
      }
    }

    timetable.push(daySchedule);
  }
  //  console.log(JSON.stringify(timetable, null, 2)); // Log the JSON object to the terminal

  const examplesDir = path.resolve(__dirname, '../../../examples');
  console.log('🚀 ~ examplesDir:', examplesDir);
  mkdirSync(examplesDir, { recursive: true }); // Create the directory if it doesn't exist
  writeFileSync(path.join(examplesDir, 'timetable.json'), JSON.stringify(timetable, null, 2)); // Write the JSON object to a file
  //writeFileSync(`./../examples/timetable.json`, JSON.stringify(timetable, null, 2)); // Write the JSON object to a file
}
