"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constraints_1 = require("./constraints");
const Activity_1 = require("./models/Activity");
const Room_1 = require("./models/Room");
const StudentSet_1 = require("./models/StudentSet");
const Subject_1 = __importDefault(require("./models/Subject"));
const Teacher_1 = require("./models/Teacher");
const TimetableScheduler_1 = require("./scheduler/TimetableScheduler");
const renderConsoleTimetable_1 = require("./utils/renderConsoleTimetable");
// Initialize the scheduler with the desired number of days and periods per day
const daysCount = 5; // Example: 5 days a week
const periodsPerDay = 8; // Example: 8 periods per day
const scheduler = new TimetableScheduler_1.TimetableScheduler(daysCount, periodsPerDay);
// Example: Add some teachers, student sets, subjects, rooms, and activities
const teacher1 = new Teacher_1.Teacher('t1', 'John Doe');
const studentSet1 = new StudentSet_1.StudentSet('s1', 'Class 1A');
const subject1 = new Subject_1.default('sub1', 'Mathematics');
const room1 = new Room_1.Room('r1', 'Room 101', 30);
const activity1 = new Activity_1.Activity('a1', 'Math Class', subject1, 1);
// Add components to the scheduler
scheduler.addRoom(room1);
scheduler.addActivity(activity1);
scheduler.addTimeConstraint(new constraints_1.TeacherNotAvailablePeriods(teacher1));
scheduler.addSpaceConstraint(new constraints_1.RoomNotAvailable(room1));
// Generate the schedule
const assignment = scheduler.generateSchedule();
// Render the timetable to the console
(0, renderConsoleTimetable_1.renderConsoleTimetable)(assignment, daysCount, periodsPerDay);
//# sourceMappingURL=index.js.map