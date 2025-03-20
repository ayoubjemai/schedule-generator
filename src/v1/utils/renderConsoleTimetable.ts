import { TimetableAssignment } from '../scheduler/TimetableAssignment';

export function renderConsoleTimetable(
  assignment: TimetableAssignment,
  daysCount: number,
  periodsPerDay: number
): void {
  const timetable = [];

  for (let day = 0; day < daysCount; day++) {
    const daySchedule = { day: day + 1, periods: [] as any[] };

    for (let hour = 0; hour < periodsPerDay; hour++) {
      const activity = assignment.getActivityAtSlot(day, hour);
      if (activity) {
        const roomId = assignment.getRoomForActivity(activity.id);
        daySchedule.periods.push({
          hour,
          activity: activity.name,
          room: roomId,
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

  console.log(JSON.stringify(timetable, null, 2)); // Log the JSON object to the terminal
}
