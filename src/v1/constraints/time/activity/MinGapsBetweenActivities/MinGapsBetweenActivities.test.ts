import { Activity } from "../../../../models/Activity";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { Room } from "../../../../models/Room";
import { MinGapsBetweenActivities } from "./MinGapsBetweenActivities";
describe("MinGapsBetweenActivities", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30;
  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let subject: Subject;
  let constraint: MinGapsBetweenActivities;
  let room: Room;
  let slot1: Period;
  let slot2WithSufficientGap: Period;
  let slot2WithInsufficientGap: Period;
  let slot2OnDifferentDay: Period;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");
    activity1 = new Activity("a1", "Math Lecture", subject, 60); 
    activity2 = new Activity("a2", "Another Math Lecture", subject, 60);
    room = new Room("r1", "Classroom 101", 30);
    slot1 = { day: 0, hour: 9, minute: 0 };
    slot2WithSufficientGap = { day: 0, hour: 10, minute: 45 };
    slot2WithInsufficientGap = { day: 0, hour: 10, minute: 15 };
    slot2OnDifferentDay = { day: 1, hour: 9, minute: 0 };
    constraint = new MinGapsBetweenActivities(MIN_GAP_MINUTES);
  });
  it("should be satisfied when no activities are assigned", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when only one activity is assigned", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when activities have sufficient gap between them", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2WithSufficientGap, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should not be satisfied when activities have insufficient gap between them", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2WithInsufficientGap, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should be satisfied when activities are on different days", () => {
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2OnDifferentDay, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;
    assignment.assignActivity(activity1, slot1, room.id);
    assignment.assignActivity(activity2, slot2WithInsufficientGap, room.id);
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
    assignment.assignActivity(activity2, slot2WithSufficientGap, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(2);
  });
});
