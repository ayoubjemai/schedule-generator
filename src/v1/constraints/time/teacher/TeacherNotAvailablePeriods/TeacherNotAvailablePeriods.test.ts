import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { TeacherNotAvailablePeriods } from "./TeacherNotAvailablePeriods";

describe("TeacherNotAvailablePeriods", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;

  let assignment: TimetableAssignment;
  let activity: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherNotAvailablePeriods;
  let room: Room;
  let availableSlot: Period;
  let notAvailableSlot: Period;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    // Create a teacher with a not available period
    notAvailableSlot = { day: 0, hour: 14, minute: 0 };
    teacher = new Teacher("t1", "John Doe");
    teacher.get("notAvailablePeriods"); // Initialize the field
    // Add not available periods through the constraint

    // Create activity with the teacher
    activity = new Activity("a1", "Math Lecture", subject, 60);
    activity.teachers.push(teacher);

    room = new Room("r1", "Classroom 101", 30);

    // Define an available slot
    availableSlot = { day: 0, hour: 9, minute: 0 };

    constraint = new TeacherNotAvailablePeriods(teacher);
    // Manually set the periods for the constraint
    constraint.periods = [notAvailableSlot];
  });

  it("should be satisfied when no activities are assigned to the teacher", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher's activity is assigned during available periods", () => {
    assignment.assignActivity(activity, availableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher's activity is assigned during not available periods", () => {
    assignment.assignActivity(activity, notAvailableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should be satisfied when activity spans over available periods", () => {
    // Create an activity that ends before the not available period
    const morningActivity = new Activity("a2", "Morning Lecture", subject, 60);
    morningActivity.teachers.push(teacher);
    assignment.assignActivity(morningActivity, availableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when activity spans into not available periods", () => {
    // Create a slot right before the not available period
    const slotBeforeNotAvailable = { day: 0, hour: 13, minute: 30 };

    // Activity with duration that spans into the not available period
    const longActivity = new Activity("a3", "Long Lecture", subject, 60);
    longActivity.teachers.push(teacher);
    assignment.assignActivity(longActivity, slotBeforeNotAvailable, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    assignment.assignActivity(activity, notAvailableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    assignment.assignActivity(activity, availableSlot, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities.length).toBe(1);

    const activity2 = new Activity("a2", "Another Math Lecture", subject, 60);
    activity2.teachers.push(teacher);
    assignment.assignActivity(activity2, availableSlot, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it("should not add duplicate activities", () => {
    constraint.addActivity(activity);
    constraint.addActivity(activity);

    expect(constraint.activities.length).toBe(1);
  });

  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherActivity = new Activity("a4", "Physics Lecture", subject, 60);
    otherActivity.teachers.push(otherTeacher);

    assignment.assignActivity(otherActivity, notAvailableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
