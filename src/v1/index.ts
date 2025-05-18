import {
  ActivitiesNotOverlapping,
  MaxConsecutiveHoursForTeacher,
  PreferredRoomsForActivity,
  RoomNotAvailable,
  StudentSetNotAvailablePeriods,
  TeacherMaxDaysPerWeek,
  TeacherMaxGapPerDayBetweenActivities,
  TeacherMaxMinutesPerDay,
  TeacherMaxSpanPerDay,
  TeacherMinDaysPerWeek,
  TeacherMinGapBetweenActivityTags,
  TeacherMinHoursDaily,
  TeacherMinHoursDailyInActivityTag,
  TeacherMinRestingHours,
  TeacherNotAvailablePeriods,
} from './constraints';

import { Activity } from './models/Activity';
import { ActivityTag } from './models/ActivityTag';
import { Room } from './models/Room';
import { StudentSet } from './models/StudentSet';
import Subject from './models/Subject';
import { Teacher } from './models/Teacher';
import { TimetableScheduler } from './scheduler/TimetableScheduler';
import { logToFile } from './utils/logToFile';
import { renderConsoleTimetable } from './utils/renderConsoleTimetable';

// Initialize the scheduler
const daysCount = 5;
const periodsPerDay = 8;
const scheduler = new TimetableScheduler(daysCount, periodsPerDay);

// Create tags
const lectureTags = new ActivityTag('tag1', 'Lecture');
const labTag = new ActivityTag('tag2', 'Lab');
const tutorialTag = new ActivityTag('tag3', 'Tutorial');

// Create teachers
const teacher1 = new Teacher('t1', 'John Doe', {
  maxSpanPerDay: 3,
  minHoursContinuously: 1,
  maxDaysPerWeek: 6,
  minDaysPerWeek: 1,
  maxGapsPerDay: 120,
  minGapsPerDay: 2,
  maxHoursDaily: 6,
  maxHoursContinuously: 2,
  minHoursDaily: 1,
  notAvailablePeriods: [
    { day: 0, hour: 0, minute: 50 },
    { day: 4, hour: 7, minute: 10 },
  ],
  minHoursDailyActivityTagPerMinutes: new Map<`${string}_${string}`, number>().set(
    `${lectureTags.id}_${tutorialTag.id}`,
    2
  ),
  minRestingHours: 24,
});
const teacher2 = new Teacher('t2', 'Jane Smith', {
  notAvailablePeriods: [
    { day: 1, hour: 0, minute: 30 },
    { day: 1, hour: 1, minute: 30 },
  ],
  maxGapsPerDay: 60,
  minRestingHours: 1,
});

// Create student sets
const class1A = new StudentSet('s1', {
  name: 'Class 1A',
  notAvailablePeriods: [
    { day: 4, hour: 6, minute: 20 },
    { day: 4, hour: 7, minute: 0 },
  ],
  maxHoursDaily: 6,
  minHoursDaily: 4,
});
const class1B = new StudentSet('s2', {
  name: 'Class 1B',
  notAvailablePeriods: [
    { day: 0, hour: 0, minute: 20 },
    { day: 0, hour: 1, minute: 30 },
  ],
  maxDaysPerWeek: 4,
  maxGapsPerDay: 1,
});

// Define student availability
// class1A.notAvailablePeriods.push({ day: 4, hour: 6, minute: 20 }, { day: 4, hour: 7, minute: 0 });
// class1B.notAvailablePeriods.push({ day: 0, hour: 0, minute: 20 }, { day: 0, hour: 1, minute: 30 });

// Set student set constraints
// class1A.maxHoursDaily = 6;
// class1A.minHoursDaily = 4;
// class1B.maxDaysPerWeek = 4;
// class1B.maxGapsPerDay = 1;

// Create subjects
const math = new Subject('sub1', 'Mathematics');
const physics = new Subject('sub2', 'Physics');
const chemistry = new Subject('sub3', 'Chemistry');

// Assign preferred rooms to subjects
math.preferredRooms = ['r1', 'r2'];
physics.preferredRooms = ['r3'];

// Assign preferred rooms to tags
labTag.preferredRooms = ['r3', 'r4'];

// Create rooms
const room1 = new Room('r1', 'Room 101', 30);
const room2 = new Room('r2', 'Room 102', 25);
const room3 = new Room('r3', 'Lab Room', 20, 'Science Building');
const room4 = new Room('r4', 'Computer Lab', 20, 'Tech Building');

// Set room unavailability
room1.notAvailablePeriods.push({ day: 2, hour: 4, minute: 12 });
room3.notAvailablePeriods.push({ day: 3, hour: 3, minute: 45 }, { day: 3, hour: 4, minute: 40 });

// Create activities
const mathLecture = new Activity('a1', 'Math Lecture', math, 2 * 60);
mathLecture.teachers.push(teacher1);
mathLecture.studentSets.push(class1A, class1B);
mathLecture.activityTags.push(lectureTags);
mathLecture.preferredStartingTimes.push({ day: 0, hour: 1, minute: 10 }, { day: 2, hour: 3, minute: 30 });
mathLecture.preferredStartingTime = { day: 0, hour: 1, minute: 10 };

const physicsLab = new Activity('a2', 'Physics lab', physics, 2 * 60);
physicsLab.teachers.push(teacher2);
physicsLab.studentSets.push(class1A);
physicsLab.activityTags.push(labTag);
physicsLab.preferredRooms = ['r3'];
mathLecture.preferredStartingTimes.push({ day: 0, hour: 5, minute: 10 });
physicsLab.preferredStartingTime = { day: 0, hour: 3, minute: 10 };

const chemistryLecture = new Activity('a3', 'Chemistry Tutorial', chemistry, 1 * 60);
chemistryLecture.teachers.push(teacher1);
chemistryLecture.studentSets.push(class1B);
chemistryLecture.activityTags.push(tutorialTag);
//chemistryLecture.preferredStartingTime = { day: 0, hour: 3, minute: 10 };

// Add rooms and activities to scheduler
scheduler.addRoom(room1);
scheduler.addRoom(room2);
scheduler.addRoom(room3);
scheduler.addRoom(room4);

scheduler.addActivity(mathLecture);
scheduler.addActivity(physicsLab);
scheduler.addActivity(chemistryLecture);

// Add time constraints
scheduler.addTimeConstraint(new ActivitiesNotOverlapping());
scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher1));
scheduler.addTimeConstraint(new TeacherMinDaysPerWeek(teacher1, teacher1.get('minDaysPerWeek') || 1));
scheduler.addTimeConstraint(new TeacherMinHoursDaily(teacher1, teacher1.get('minHoursDaily') || 1));
scheduler.addTimeConstraint(new TeacherMaxMinutesPerDay(teacher1, (teacher1.get('maxHoursDaily') || 0) * 60));
scheduler.addTimeConstraint(new TeacherMaxSpanPerDay(teacher1, teacher1.get('maxSpanPerDay') || 0));
scheduler.addTimeConstraint(new TeacherMinRestingHours(teacher1, teacher1.get('minRestingHours') || 12));

// scheduler.addTimeConstraint(
//   new MinConsecutiveHoursForTeacher(teacher1, teacher1.get('minHoursContinuously') || 3)
// );
scheduler.addTimeConstraint(
  new MaxConsecutiveHoursForTeacher(teacher1, teacher1.get('maxHoursContinuously') || 4)
);
//? info : this constraint only for testing purposes , the two together too hard to generate with two of them
scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.get('maxDaysPerWeek') || 5));
// scheduler.addTimeConstraint(
//   new TeacherMinGapPerDayBetweenActivities(teacher1, teacher1.get('minGapsPerDay') ?? 10)
// );
scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.get('maxDaysPerWeek') || 5));
scheduler.addTimeConstraint(new TeacherMinGapBetweenActivityTags(teacher1, lectureTags.id, tutorialTag.id));

// scheduler.addTimeConstraint(
//   new TeacherMaxHoursContinouslyInActivityTag(
//     teacher1,
//     lectureTags.id,
//     teacher1.get('maxHoursContinuously') || 5
//   )
// );

scheduler.addTimeConstraint(
  new TeacherMinHoursDailyInActivityTag(
    teacher1,
    lectureTags.id,
    teacher1.get('minHoursDailyByActivityTag')?.get(lectureTags.id) || 2
  )
);

scheduler.addTimeConstraint(new TeacherMaxGapPerDayBetweenActivities(teacher1, 0, 100));
scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher2));

scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class1A));
scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class1B));
//scheduler.addTimeConstraint(new MinGapsBetweenActivities(0));
// scheduler.addTimeConstraint(
//   new PreferredStartingTimesForActivity(mathLecture, mathLecture.preferredStartingTimes, 50)
// );

// Add space constraints
scheduler.addSpaceConstraint(new RoomNotAvailable(room1));
scheduler.addSpaceConstraint(new RoomNotAvailable(room3));
scheduler.addSpaceConstraint(new PreferredRoomsForActivity(mathLecture, math.preferredRooms));
scheduler.addSpaceConstraint(new PreferredRoomsForActivity(physicsLab, physicsLab.preferredRooms));

// Generate the schedule
console.log('Generating timetable...');

const assignment = scheduler.generateSchedule();

// Output the schedule
console.log('\nGenerated Timetable:');
renderConsoleTimetable(assignment, daysCount, periodsPerDay);

const { teacherSchedules, studentSetSchedules, roomSchedules } = scheduler.exportSchedule(assignment);

// Log the schedule to a file
logToFile('schedule', { teacherSchedules, studentSetSchedules, roomSchedules });

// Print constraint violations if any
const violations = scheduler.analyzeConstraintViolations(assignment);
if (Object.keys(violations).length > 0) {
  console.log('\nConstraint Violations:');
  console.log(violations);
} else {
  console.log('\nNo constraint violations detected!');
}
