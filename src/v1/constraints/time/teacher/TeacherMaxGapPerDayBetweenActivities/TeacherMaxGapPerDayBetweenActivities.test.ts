import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherMaxGapPerDayBetweenActivities } from "./TeacherMaxGapPerDayBetweenActivities";

describe("TeacherMaxGapPerDayBetweenActivities", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_GAP_MINUTES = 120; // 2 hours maximum gap

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxGapPerDayBetweenActivities;
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

    constraint = new TeacherMaxGapPerDayBetweenActivities(teacher, MAX_GAP_MINUTES);
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

  it("should be satisfied when teacher has multiple activities with small gaps", () => {
    // First activity at 8:00-9:00, second activity at 10:00-11:00 (1-hour gap)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has activities with gaps equal to the maximum", () => {
    // First activity at 8:00-9:00, second activity at 11:00-12:00 (2-hour gap, equal to MAX_GAP_MINUTES)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher has activities with gaps exceeding the maximum", () => {
    // First activity at 8:00-9:00, second activity at 12:00-13:00 (3-hour gap, exceeds MAX_GAP_MINUTES)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should check each day independently", () => {
    // Day 0: 1-hour gap (satisfied)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 3-hour gap (exceeds maximum)
    assignment.assignActivity(activity3, { day: 1, hour: 8, minute: 0 }, room.id);
    const activity4 = new Activity("a4", "Math Lecture 4", subject, 60);
    activity4.teachers.push(teacher);
    assignment.assignActivity(activity4, { day: 1, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should consider all combinations of activities within a day", () => {
    // Three activities in a day
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:00 (1h gap after act1)
    assignment.assignActivity(activity3, { day: 0, hour: 14, minute: 0 }, room.id); // 14:00-15:00 (3h gap after act2)

    // Gap between activity2 and activity3 exceeds maximum
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should handle activities with overlapping times", () => {
    // Two activities that partially overlap
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activity2, { day: 0, hour: 8, minute: 30 }, room.id); // 8:30-9:30 (overlaps with activity1)

    // No gap between overlapping activities
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Set up activities with excessive gap
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 15, minute: 0 }, room.id); // 6-hour gap

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
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 1-hour gap

    // Set up activities for other teacher with excessive gap
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 0, hour: 14, minute: 0 }, room.id); // 5-hour gap

    // Should be satisfied because the other teacher's activities are not counted
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
