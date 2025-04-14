import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherMaxSpanPerDay } from "./TeacherMaxSpanPerDay";

describe("TeacherMaxSpanPerDay", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_SPAN_HOURS = 6;

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxSpanPerDay;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    teacher = new Teacher("t1", "John Doe");

    // Create activities with 1-hour duration
    activity1 = new Activity("a1", "Math Lecture 1", subject, 60);
    activity1.teachers.push(teacher);

    activity2 = new Activity("a2", "Math Lecture 2", subject, 60);
    activity2.teachers.push(teacher);

    activity3 = new Activity("a3", "Math Lecture 3", subject, 60);
    activity3.teachers.push(teacher);

    room = new Room("r1", "Classroom 101", 30);

    constraint = new TeacherMaxSpanPerDay(teacher, MAX_SPAN_HOURS);
  });

  it("should be satisfied when no activities are assigned to the teacher", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has only one activity per day", () => {
    // Single activity on each day
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher's daily span is below maximum", () => {
    // First activity at 8:00, last activity ends at 12:00 (4-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 11, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher's daily span equals maximum", () => {
    // First activity at 8:00, last activity ends at 14:00 (6-hour span, equal to MAX_SPAN_HOURS)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id); // Ends at 14:00

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher's daily span exceeds maximum", () => {
    // First activity at 8:00, last activity ends at 15:00 (7-hour span, exceeds MAX_SPAN_HOURS)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 14, minute: 0 }, room.id); // Ends at 15:00

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should check each day independently", () => {
    // Day 0: 4-hour span (satisfied)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    // Day 1: 7-hour span (exceeds maximum)
    const activity4 = new Activity("a4", "Math Lecture 4", subject, 60);
    activity4.teachers.push(teacher);
    const activity5 = new Activity("a5", "Math Lecture 5", subject, 60);
    activity5.teachers.push(teacher);

    assignment.assignActivity(activity4, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity5, { day: 1, hour: 14, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should account for activity duration in span calculation", () => {
    // Create a longer activity
    const longActivity = new Activity("a4", "Long Math Lecture", subject, 180); // 3 hours
    longActivity.teachers.push(teacher);

    // First activity at 8:00, long activity starts at 13:00 and ends at 16:00 (8-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longActivity, { day: 0, hour: 13, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Set up activities with excessive span
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 16, minute: 0 }, room.id); // 9-hour span

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
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
    const otherActivity1 = new Activity("oa1", "Physics Lecture 1", subject, 60);
    otherActivity1.teachers.push(otherTeacher);
    const otherActivity2 = new Activity("oa2", "Physics Lecture 2", subject, 60);
    otherActivity2.teachers.push(otherTeacher);

    // Set up activities for main teacher within limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 13, minute: 0 }, room.id); // 6-hour span

    // Set up activities for other teacher with excessive span
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 0, hour: 16, minute: 0 }, room.id); // 9-hour span

    // Should be satisfied because the other teacher's activities are not counted
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
