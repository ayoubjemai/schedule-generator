import { Activity } from '../models/Activity';
import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { logToFile } from './logToFile';

export function renderConsoleTimetable(
  assignment: TimetableAssignment,
  daysCount: number,
  periodsPerDay: number
): void {
  const timetable = [];

  for (let day = 0; day < daysCount; day++) {
    const daySchedule = {
      day,
      periods: [] as {
        hour: number;
        minute: number;
        activity: string;
        room: string | null;
        totalDurationInMinutes: number;
        activityId: string;
      }[],
    };

    let activity: Activity | undefined;
    for (let hour = 0; hour <= periodsPerDay; hour++) {
      for (let min = 0; min < 60; min++) {
        activity = assignment.getActivityAtSlot({ day, hour, minute: min });
        if (activity) break;
      }

      if (activity) {
        const roomId = assignment.getRoomForActivity(activity.id);
        const slot = assignment.getSlotForActivity(activity.id);
        if (!slot) throw new Error('Slot not found for activity ' + activity.name);
        if (daySchedule.periods.find(period => period.activityId === activity!.id)) continue;
        daySchedule.periods.push({
          hour: slot.hour,
          activity: activity.name,
          room: roomId || null,
          minute: slot.minute,
          totalDurationInMinutes: activity.totalDurationInMinutes,
          activityId: activity.id,
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

  logToFile('timetable', timetable);
}
