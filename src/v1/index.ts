import {
  ActivitiesNotOverlapping,
  MaxConsecutiveHoursForTeacher,
  MinGapsBetweenActivities,
  PreferredRoomsForActivity,
  PreferredStartingTimesForActivity,
  RoomNotAvailable,
  StudentSetNotAvailablePeriods,
  TeacherMaxDaysPerWeek,
  TeacherNotAvailablePeriods,
} from './constraints';
import { TeacherMinDaysPerWeek } from './constraints/time/teacher/TeacherMinDaysPerWeek';
import { Activity } from './models/Activity';
import { ActivityTag } from './models/ActivityTag';
import { Room } from './models/Room';
import { StudentSet } from './models/StudentSet';
import Subject from './models/Subject';
import { Teacher } from './models/Teacher';
import { TimetableScheduler } from './scheduler/TimetableScheduler';
import { logToFile } from './utils/logToFile';
import { renderConsoleTimetable } from './utils/renderConsoleTimetable';
import { TeacherMaxGapPerDayBetweenActivities } from './constraints/time/teacher/TeacherMaxGapPerDayBetweenActivities';
import { TeacherMinGapPerDayBetweenActivities } from './constraints/time/teacher/TeacherMinGapPerDayBetweenActivities';
import { TeacherMaxMinutesPerDay } from './constraints/time/teacher/TeacherMaxHoursPerDay';
import { MinConsecutiveHoursForTeacher } from './constraints/time/teacher/MinConsecutiveHoursForTeacher';

// Initialize the scheduler
const daysCount = 5;
const periodsPerDay = 8;
const scheduler = new TimetableScheduler(daysCount, periodsPerDay);

// Create teachers
const teacher1 = new Teacher('t1', 'John Doe');
const teacher2 = new Teacher('t2', 'Jane Smith');

// Define teacher availability
teacher1.notAvailablePeriods.push({ day: 0, hour: 0, minute: 50 }, { day: 4, hour: 7, minute: 10 });
teacher2.notAvailablePeriods.push({ day: 1, hour: 0, minute: 30 }, { day: 1, hour: 1, minute: 30 });

// Set teacher preferences/constraints
teacher1.maxDaysPerWeek = 6;
teacher1.minDaysPerWeek = 1;
teacher1.maxGapsPerDay = 0;
teacher1.maxHoursDaily = 6;
teacher1.maxHoursContinuously = 3;
teacher1.minHoursContinuously = 3;
teacher2.maxGapsPerDay = 60;
teacher2.minRestingHours = 1;

// Create student sets
const class1A = new StudentSet('s1', 'Class 1A');
const class1B = new StudentSet('s2', 'Class 1B');

// Define student availability
class1A.notAvailablePeriods.push({ day: 4, hour: 6, minute: 20 }, { day: 4, hour: 7, minute: 0 });
class1B.notAvailablePeriods.push({ day: 0, hour: 0, minute: 20 }, { day: 0, hour: 1, minute: 30 });

// Set student set constraints
class1A.maxHoursDaily = 6;
class1A.minHoursDaily = 4;
class1B.maxDaysPerWeek = 4;
class1B.maxGapsPerDay = 1;

// Create subjects
const math = new Subject('sub1', 'Mathematics');
const physics = new Subject('sub2', 'Physics');
const chemistry = new Subject('sub3', 'Chemistry');

// Assign preferred rooms to subjects
math.preferredRooms = ['r1', 'r2'];
physics.preferredRooms = ['r3'];

// Create tags
const lectureTags = new ActivityTag('tag1', 'Lecture');
const labTag = new ActivityTag('tag2', 'Lab');

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

const physicsLab = new Activity('a2', 'Physics Lab', physics, 2 * 60);
physicsLab.teachers.push(teacher2);
physicsLab.studentSets.push(class1A);
physicsLab.activityTags.push(labTag);
physicsLab.preferredRooms = ['r3'];
mathLecture.preferredStartingTimes.push({ day: 0, hour: 5, minute: 10 });
physicsLab.preferredStartingTime = { day: 0, hour: 3, minute: 10 };

const chemistryLecture = new Activity('a3', 'Chemistry Lecture', chemistry, 1 * 60);
chemistryLecture.teachers.push(teacher1);
chemistryLecture.studentSets.push(class1B);
chemistryLecture.activityTags.push(lectureTags);
chemistryLecture.preferredStartingTime = { day: 0, hour: 3, minute: 10 };

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
// scheduler.addTimeConstraint(new TeacherMinDaysPerWeek(teacher1, teacher1.minDaysPerWeek));
scheduler.addTimeConstraint(new TeacherMaxMinutesPerDay(teacher1, teacher1.maxHoursDaily * 60));
//scheduler.addTimeConstraint(new MinConsecutiveHoursForTeacher(teacher1, teacher1.minHoursContinuously));
scheduler.addTimeConstraint(new MaxConsecutiveHoursForTeacher(teacher1, teacher1.maxHoursContinuously || 4));
//? info : this constraint only for testing purposes , the two together too hard to generate with two of them
//scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.maxDaysPerWeek || 5));
//scheduler.addTimeConstraint(new TeacherMinGapPerDayBetweenActivities(teacher1, teacher1.minGapsPerDay ?? 10));
scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.maxDaysPerWeek || 5));
scheduler.addTimeConstraint(new TeacherMaxGapPerDayBetweenActivities(teacher1, 0, 100));
scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher2));

scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class1A));
scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class1B));
scheduler.addTimeConstraint(new MinGapsBetweenActivities(0));
scheduler.addTimeConstraint(
  new PreferredStartingTimesForActivity(mathLecture, mathLecture.preferredStartingTimes, 50)
);

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
