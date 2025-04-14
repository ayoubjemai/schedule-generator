import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { MinConsecutiveHoursForTeacher } from "./MinConsecutiveHoursForTeacher";

describe("MinConsecutiveHoursForTeacher", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_CONSECUTIVE_HOURS = 2;

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: MinConsecutiveHoursForTeacher;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    teacher = new Teacher("t1", "John Doe");

    // Create activities with different durations
    activity1 = new Activity("a1", "Math Lecture 1", subject, 60); // 60 min
    activity1.teachers.push(teacher);

    activity2 = new Activity("a2", "Math Lecture 2", subject, 60); // 60 min
    activity2.teachers.push(teacher);

    activity3 = new Activity("a3", "Math Lecture 3", subject, 60); // 60 min
    activity3.teachers.push(teacher);

    room = new Room("r1", "Classroom 101", 30);

    constraint = new MinConsecutiveHoursForTeacher(teacher, MIN_CONSECUTIVE_HOURS);
  });

  it("should not be satisfied when no activities are assigned to the teacher", () => {
    // With no activities, the constraint is not satisfied
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should not be satisfied when teacher has only scattered short activities", () => {
    // Single hour-long activity (less than MIN_CONSECUTIVE_HOURS)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should be satisfied when teacher has consecutive activities meeting minimum hours", () => {
    // Two consecutive activities totaling 2 hours (equal to MIN_CONSECUTIVE_HOURS)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when activities have gaps between them", () => {
    // Two activities with a gap between them
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Set a small gap threshold to ensure these are not considered consecutive
    constraint.setMinGapMinutes(15);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should be satisfied when each day has sufficient consecutive hours", () => {
    // Day 0: Two consecutive lectures
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 9, minute: 0 }, room.id);

    // Day 1: Two consecutive lectures
    const activity4 = new Activity("a4", "Math Lecture 4", subject, 60);
    activity4.teachers.push(teacher);
    const activity5 = new Activity("a5", "Math Lecture 5", subject, 60);
    activity5.teachers.push(teacher);

    assignment.assignActivity(activity4, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity5, { day: 1, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when only some days have sufficient consecutive hours", () => {
    // Day 0: Two consecutive lectures (sufficient)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 9, minute: 0 }, room.id);

    // Day 1: One lecture (insufficient)
    assignment.assignActivity(activity3, { day: 1, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Only one hour-long activity (would not satisfy if active)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activity2, { day: 0, hour: 9, minute: 0 }, room.id);
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

    // Assign an activity to the main teacher
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);

    // Assign an activity to another teacher
    assignment.assignActivity(otherActivity, { day: 0, hour: 9, minute: 0 }, room.id);

    // Still shouldn't be satisfied because the second activity doesn't count
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
