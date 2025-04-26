import { Activity } from "../../../../models/Activity";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { PreferredStartingTimesForActivity } from "./PreferredStartingTimesForActivity";
import { Room } from "../../../../models/Room";
describe("PreferredStartingTimesForActivity", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  let assignment: TimetableAssignment;
  let activity: Activity;
  let subject: Subject;
  let constraint: PreferredStartingTimesForActivity;
  let preferredTime: Period;
  let otherTime: Period;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Mathematics");
    activity = new Activity("a1", "Math Lecture", subject, 60);
    room = new Room("r1", "Classroom 101", 30);
    preferredTime = { day: 0, hour: 9, minute: 0 };
    otherTime = { day: 1, hour: 14, minute: 0 };
    const preferredTimes = [preferredTime];
    constraint = new PreferredStartingTimesForActivity(activity, preferredTimes);
  });
  it("should be satisfied when activity is not assigned to any time slot", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should be satisfied when activity is assigned to a preferred time", () => {
    assignment.assignActivity(activity, preferredTime, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should not be satisfied when activity is assigned to a non-preferred time", () => {
    assignment.assignActivity(activity, otherTime, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;
    assignment.assignActivity(activity, otherTime, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should always be satisfied when preferred times list is empty", () => {
    const emptyConstraint = new PreferredStartingTimesForActivity(activity, []);
    assignment.assignActivity(activity, otherTime, room.id);
    expect(emptyConstraint.isSatisfied(assignment)).toBe(true);
  });
  it("should maintain a list of activities that the constraint applies to", () => {
    expect(constraint.activities).toContain(activity);
    const activity2 = new Activity("a2", "Another Math Lecture", subject, 60);
    constraint.addActivity(activity2);
    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });
  it("should not add duplicate activities", () => {
    expect(constraint.activities.length).toBe(1);
    constraint.addActivity(activity);
    expect(constraint.activities.length).toBe(1);
  });
});
