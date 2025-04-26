import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { PreferredRoomsForActivity } from './PreferredRoomsForActivity';
describe('PreferredRoomsForActivity', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  let assignment: TimetableAssignment;
  let activity: Activity;
  let subject: Subject;
  let constraint: PreferredRoomsForActivity;
  let preferredRoom: Room;
  let otherRoom: Room;
  let slot: Period;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activity = new Activity('a1', 'Math Lecture', subject, 60);
    preferredRoom = new Room('r1', 'Preferred Room', 30);
    otherRoom = new Room('r2', 'Other Room', 30);
    slot = { day: 0, hour: 1, minute: 0 };
    const preferredRooms = [preferredRoom.id];
    constraint = new PreferredRoomsForActivity(activity, preferredRooms);
  });
  it('should be satisfied when activity is not assigned to any room', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when activity is assigned to a preferred room', () => {
    assignment.assignActivity(activity, slot, preferredRoom.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when activity is assigned to a non-preferred room', () => {
    assignment.assignActivity(activity, slot, otherRoom.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(activity, slot, otherRoom.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should always be satisfied when preferred rooms list is empty', () => {
    const emptyConstraint = new PreferredRoomsForActivity(activity, []);
    assignment.assignActivity(activity, slot, otherRoom.id);
    expect(emptyConstraint.isSatisfied(assignment)).toBe(true);
  });
  it('should use preferred rooms from activity if none provided in constructor', () => {
    activity.preferredRooms = [preferredRoom.id];
    const activityPreferredConstraint = new PreferredRoomsForActivity(activity, []);
    assignment.assignActivity(activity, slot, preferredRoom.id);
    expect(activityPreferredConstraint.isSatisfied(assignment)).toBe(true);
    assignment.removeActivity(activity);
    assignment.assignActivity(activity, slot, otherRoom.id);
    expect(activityPreferredConstraint.isSatisfied(assignment)).toBe(false);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    expect(constraint.activities).toContain(activity);
    const activity2 = new Activity('a2', 'Another Math Lecture', subject, 60);
    constraint.addActivity(activity2);
    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });
  it('should not add duplicate activities', () => {
    expect(constraint.activities.length).toBe(1);
    constraint.addActivity(activity);
    expect(constraint.activities.length).toBe(1);
  });
});
