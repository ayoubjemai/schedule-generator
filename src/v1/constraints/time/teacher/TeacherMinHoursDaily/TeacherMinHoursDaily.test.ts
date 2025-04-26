import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import Subject from "../../../../models/Subject";
import { TeacherMinHoursDaily } from "./TeacherMinHoursDaily";
describe("TeacherMinHoursDaily", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 3; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinHoursDaily;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "History");
    teacher = new Teacher("t1", "John Doe");
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `History Activity ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activities.push(activity);
    }
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`l${i + 1}`, `History Long ${i + 1}`, subject, 90);
      activity.teachers.push(teacher);
      activities.push(activity);
    }
    for (let i = 0; i < 4; i++) {
      const activity = new Activity(`s${i + 1}`, `History Short ${i + 1}`, subject, 30);
      activity.teachers.push(teacher);
      activities.push(activity);
    }
    room = new Room("r1", "History Classroom", 30);
    constraint = new TeacherMinHoursDaily(teacher, MIN_HOURS_DAILY);
  });
  it("should throw an error when the teacher doesn't have enough total hours", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    expect(() => constraint.isSatisfied(assignment)).toThrow();
  });
  it("should be satisfied when each day meets the minimum hours requirement", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should not be satisfied when any day has less than the minimum hours", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[6], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should ignore days with no activities", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 2, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[6], { day: 2, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[10], { day: 2, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when a day has exactly the minimum hours required", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 1, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[5], { day: 1, hour: 10, minute: 0 }, room.id);
    try {
      constraint.isSatisfied(assignment);
    } catch (e) {
    }
    for (let i = 0; i < 6; i++) {
      expect(constraint.activities).toContain(activities[i]);
    }
    expect(constraint.activities.length).toBe(6);
  });
  it("should not add duplicate activities", () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });
  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    expect(() => constraint.isSatisfied(assignment)).not.toThrow();
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherTeacherActivities = [];
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`ot${i + 1}`, `Other Teacher Activity ${i + 1}`, subject, 60);
      activity.teachers.push(otherTeacher);
      otherTeacherActivities.push(activity);
    }
    for (let i = 0; i < 3; i++) {
      assignment.assignActivity(otherTeacherActivities[i], { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }
    assignment.assignActivity(activities[0], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 0, hour: 13, minute: 0 }, room.id); 
    expect(() => constraint.isSatisfied(assignment)).toThrow();
  });
  it("should calculate total duration correctly with activities of different lengths", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[10], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[11], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[6], { day: 1, hour: 11, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should handle a high number of activities across multiple days", () => {
    const manyActivities = [];
    for (let i = 0; i < 20; i++) {
      const activity = new Activity(`m${i + 1}`, `Mini Activity ${i + 1}`, subject, 15); 
      activity.teachers.push(teacher);
      manyActivities.push(activity);
    }
    for (let i = 0; i < 12; i++) {
      assignment.assignActivity(manyActivities[i], { day: 0, hour: 8, minute: i * 15 }, room.id);
    }
    for (let i = 12; i < 20; i++) {
      assignment.assignActivity(manyActivities[i], { day: 1, hour: 8, minute: (i - 12) * 15 }, room.id);
    }
    assignment.assignActivity(activities[0], { day: 1, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[9], { day: 1, hour: 11, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
