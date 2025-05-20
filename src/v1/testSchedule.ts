import data from '../../output/timetable.json';
type Period = {
  hour: number;
  minute: number;
  totalDurationInMinutes: number;
  activityId: string;
  activity?: string;
  room?: string;
  studentSetId: string;
  teacherId: string;
};

type DaySchedule = {
  day: number;
  periods: Period[];
};

function validateSchedule(schedule: DaySchedule[]): { errors: string[]; warns: string[] } {
  const errors: string[] = [];
  const warns: string[] = [];

  for (const dayBlock of schedule) {
    const periods = dayBlock.periods.map(p => {
      const start = p.hour * 60 + p.minute;
      const end = start + p.totalDurationInMinutes;
      return { ...p, start, end };
    });

    // Sort by start time to simplify overlap detection
    periods.sort((a, b) => a.start - b.start);

    for (let i = 1; i < periods.length; i++) {
      const prev = periods[i - 1];
      const curr = periods[i];
      const isOverlapping =
        curr.start < prev.end &&
        (curr.studentSetId === prev.studentSetId ||
          curr.teacherId === prev.teacherId ||
          curr.room === prev.room);

      const isJustActivity = curr.start < prev.end;
      if (isJustActivity) {
        warns.push(
          `Just an activity on day ${dayBlock.day} between activity ${prev.activityId} and ${curr.activityId}`
        );
      }
      if (isOverlapping) {
        errors.push(
          `Overlap on day ${dayBlock.day} between activity ${prev.activityId} and ${curr.activityId}`
        );
      }
    }
  }

  return { errors, warns };
}

// Example usage:
const schedule = data;
const { errors, warns } = validateSchedule(schedule);

if (warns.length > 0) {
  console.warn('Schedule validation warnings:');
  warns.forEach(warn => console.warn(warn));
}
if (errors.length === 0) {
  console.log('Schedule is valid.');
} else {
  console.error('Schedule validation errors:');
  errors.forEach(err => console.error(err));
}
