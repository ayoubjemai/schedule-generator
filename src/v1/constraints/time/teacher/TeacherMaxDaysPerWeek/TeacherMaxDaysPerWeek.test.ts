import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherMaxDaysPerWeek } from "./TeacherMaxDaysPerWeek";

describe("TeacherMaxDaysPerWeek", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_DAYS = 3;

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxDaysPerWeek;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    teacher = new Teacher("t1", "John Doe");

    // Create activities for different days
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Lecture ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activities.push(activity);
    }

    room = new Room("r1", "Classroom 101", 30);

    constraint = new TeacherMaxDaysPerWeek(teacher, MAX_DAYS);
  });

  it("should be satisfied when no activities are assigned to the teacher", () => {
    // With no activities, there are 0 working days (less than MAX_DAYS)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has activities on fewer than the maximum days", () => {
    // Assign activities on 2 days (less than MAX_DAYS = 3)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has activities on exactly the maximum days", () => {
    // Assign activities on 3 days (equal to MAX_DAYS)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher has activities on more than the maximum days", () => {
    // Assign activities on 4 days (more than MAX_DAYS = 3)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 3, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should count each day only once even with multiple activities on the same day", () => {
    // Assign multiple activities on the same days (total: 3 days)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 2, hour: 8, minute: 0 }, room.id);

    // Only 3 unique days, which equals MAX_DAYS = 3
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Assign activities on 5 days (exceeds MAX_DAYS = 3)
    for (let i = 0; i < 5; i++) {
      assignment.assignActivity(activities[i], { day: i, hour: 8, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);
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

    // Create 5 activities for the other teacher
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`oa${i + 1}`, `Physics Lecture ${i + 1}`, subject, 60);
      activity.teachers.push(otherTeacher);
      otherActivities.push(activity);

      // Assign each activity to a different day
      assignment.assignActivity(activity, { day: i, hour: 8, minute: 0 }, room.id);
    }

    // Assign activities for the main teacher on 3 days (equal to MAX_DAYS)
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 10, minute: 0 }, room.id);

    // Other teacher has 5 days, but main teacher has 3, so constraint should be satisfied
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
