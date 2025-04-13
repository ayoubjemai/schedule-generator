import { Activity } from "../../../../models/Activity";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { Room } from "../../../../models/Room";
import { ActivitiesNotOverlapping } from "./ActivitiesNotOverlapping";

describe("ActivitiesNotOverlapping", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let subject: Subject;
  let constraint: ActivitiesNotOverlapping;
  let room: Room;
  let slot1: Period;
  let slot2: Period;
  let overlappingSlot: Period;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");

    activity1 = new Activity("a1", "Math Lecture", subject, 60);
    activity2 = new Activity("a2", "Another Math Lecture", subject, 60);

    room = new Room("r1", "Classroom 101", 30);

    // Non-overlapping slots
    slot1 = { day: 0, hour: 9, minute: 0 };
    slot2 = { day: 0, hour: 11, minute: 0 };

    // Create an overlapping slot (within the duration of activity1 if started at slot1)
    overlappingSlot = { day: 0, hour: 9, minute: 30 };

    constraint = new ActivitiesNotOverlapping();
  });

  it("should be satisfied when no activities are assigned", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when only one activity is assigned", () => {
    assignment.assignActivity(activity1, slot1, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when activities are assigned to non-overlapping time slots", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when activities are assigned to overlapping time slots", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, overlappingSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, overlappingSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities that the constraint applies to", () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity2);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it("should not add duplicate activities", () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity1);

    expect(constraint.activities.length).toBe(1);
  });

  it("should automatically add activities from assignments during satisfaction check", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2, room.id);

    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });
});
