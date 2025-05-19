import data from '../../examples/1747693438531/timetable.json';
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

function validateSchedule(schedule: DaySchedule[]): string[] {
  const errors: string[] = [];

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
      if (
        curr.start < prev.end &&
        (curr.studentSetId === prev.studentSetId ||
          curr.teacherId === prev.teacherId ||
          curr.room === prev.room)
      ) {
        errors.push(
          `Overlap on day ${dayBlock.day} between activity ${prev.activityId} and ${curr.activityId}`
        );
      }
    }
  }

  return errors;
}

// Example usage:
const schedule = data;
const result = validateSchedule(schedule);

if (result.length === 0) {
  console.log('Schedule is valid.');
} else {
  console.error('Schedule validation errors:');
  result.forEach(err => console.error(err));
}
