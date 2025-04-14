import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherMaxMinutesPerDay } from "./TeacherMaxHoursPerDay";

describe("TeacherMaxMinutesPerDay", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_MINUTES_PER_DAY = 180; // 3 hours max per day

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxMinutesPerDay;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    teacher = new Teacher("t1", "John Doe");

    // Create activities with different durations
    activity1 = new Activity("a1", "Math Lecture 1", subject, 60); // 60 minutes
    activity1.teachers.push(teacher);

    activity2 = new Activity("a2", "Math Lecture 2", subject, 90); // 90 minutes
    activity2.teachers.push(teacher);

    activity3 = new Activity("a3", "Math Lecture 3", subject, 60); // 60 minutes
    activity3.teachers.push(teacher);

    room = new Room("r1", "Classroom 101", 30);

    constraint = new TeacherMaxMinutesPerDay(teacher, MAX_MINUTES_PER_DAY);
  });

  it("should be satisfied when no activities are assigned to the teacher", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher's total daily minutes are below the maximum", () => {
    // Assign 2 activities on the same day, totaling 150 minutes (below MAX_MINUTES_PER_DAY)
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher's activities are distributed across different days", () => {
    // Total would be 210 minutes if on the same day, but they're on different days
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); // 60 min, day 0
    assignment.assignActivity(activity2, { day: 1, hour: 10, minute: 0 }, room.id); // 90 min, day 1
    assignment.assignActivity(activity3, { day: 0, hour: 11, minute: 0 }, room.id); // 60 min, day 0

    // Day 0: 120 minutes, Day 1: 90 minutes - both under the limit
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher's total daily minutes exceed the maximum", () => {
    // Assign 3 activities on the same day, totaling 210 minutes (exceeds MAX_MINUTES_PER_DAY)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Assign 3 activities on the same day, totaling 210 minutes (exceeds MAX_MINUTES_PER_DAY)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it("should not add duplicate activities", () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity1);

    expect(constraint.activities.length).toBe(1);
  });

  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherActivity = new Activity("a4", "Physics Lecture", subject, 120);
    otherActivity.teachers.push(otherTeacher);

    // Assign teacher's activities close to the limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Assign other teacher's activity on the same day
    assignment.assignActivity(otherActivity, { day: 0, hour: 12, minute: 0 }, room.id);

    // Should still be satisfied as the other teacher's activity isn't counted
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
