import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherMaxDayInIntervalHours } from "./TeacherMaxDayInIntervalHours";
describe("TeacherMaxDayInIntervalHours", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_DAYS = 3;
  const INTERVAL_START = { hour: 12, minute: 0 }; 
  const INTERVAL_END = { hour: 16, minute: 0 }; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxDayInIntervalHours;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");
    teacher = new Teacher("t1", "John Doe");
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Lecture ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activities.push(activity);
    }
    room = new Room("r1", "Classroom 101", 30);
    constraint = new TeacherMaxDayInIntervalHours(teacher, MAX_DAYS, INTERVAL_START, INTERVAL_END);
  });
  it("should be satisfied when no activities are assigned to the teacher", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when teacher has activities outside the specified time interval", () => {
    for (let i = 0; i < 5; i++) {
      assignment.assignActivity(activities[i], { day: i, hour: 8, minute: 0 }, room.id); 
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when teacher has activities within the interval on fewer than max days", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 14, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when teacher has activities within the interval on exactly max days", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 14, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 15, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should not be satisfied when teacher has activities within the interval on more than max days", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 14, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 15, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 3, hour: 12, minute: 30 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should count each day only once even with multiple activities within the interval", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 15, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 14, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 2, hour: 15, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should properly detect activities that partially overlap with the interval", () => {
    const longActivity1 = new Activity("long1", "Long Math Lecture 1", subject, 120); 
    longActivity1.teachers.push(teacher);
    assignment.assignActivity(longActivity1, { day: 0, hour: 11, minute: 0 }, room.id); 
    const longActivity2 = new Activity("long2", "Long Math Lecture 2", subject, 120); 
    longActivity2.teachers.push(teacher);
    assignment.assignActivity(longActivity2, { day: 1, hour: 15, minute: 0 }, room.id); 
    assignment.assignActivity(activities[0], { day: 2, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 3, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 4, hour: 17, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;
    for (let i = 0; i < 5; i++) {
      assignment.assignActivity(activities[i], { day: i, hour: 13, minute: 0 }, room.id);
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 13, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities.length).toBe(1);
    assignment.assignActivity(activities[1], { day: 1, hour: 14, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities.length).toBe(2);
  });
  it("should not add duplicate activities", () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });
  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherActivities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`oa${i + 1}`, `Physics Lecture ${i + 1}`, subject, 60);
      activity.teachers.push(otherTeacher);
      otherActivities.push(activity);
      assignment.assignActivity(activity, { day: i, hour: 13, minute: 0 }, room.id);
    }
    assignment.assignActivity(activities[0], { day: 0, hour: 14, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 14, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
