import { RoomNotAvailable, TeacherNotAvailablePeriods } from './constraints';
import { Activity } from './models/Activity';
import { Room } from './models/Room';
import { StudentSet } from './models/StudentSet';
import Subject from './models/Subject';
import { Teacher } from './models/Teacher';
import { TimetableScheduler } from './scheduler/TimetableScheduler';
import { renderConsoleTimetable } from './utils/renderConsoleTimetable';

// Initialize the scheduler with the desired number of days and periods per day
const daysCount = 5; // Example: 5 days a week
const periodsPerDay = 8; // Example: 8 periods per day
const scheduler = new TimetableScheduler(daysCount, periodsPerDay);

// Example: Add some teachers, student sets, subjects, rooms, and activities
const teacher1 = new Teacher('t1', 'John Doe');
const studentSet1 = new StudentSet('s1', 'Class 1A');
const subject1 = new Subject('sub1', 'Mathematics');
const room1 = new Room('r1', 'Room 101', 30);
const activity1 = new Activity('a1', 'Math Class', subject1, 1);

// Add components to the scheduler
scheduler.addRoom(room1);
scheduler.addActivity(activity1);
scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher1));
scheduler.addSpaceConstraint(new RoomNotAvailable(room1));

// Generate the schedule
const assignment = scheduler.generateSchedule();

// Render the timetable to the console
renderConsoleTimetable(assignment, daysCount, periodsPerDay);
