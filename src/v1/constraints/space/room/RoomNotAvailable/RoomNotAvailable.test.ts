import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { RoomNotAvailable } from './RoomNotAvailable';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';

describe('RoomNotAvailable', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;

  let assignment: TimetableAssignment;
  let activity: Activity;
  let subject: Subject;
  let constraint: RoomNotAvailable;
  let room: Room;
  let availableSlot: Period;
  let notAvailableSlot: Period;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activity = new Activity('a1', 'Math Lecture', subject, 60);

    // Create a room with a not available period
    notAvailableSlot = { day: 0, hour: 14, minute: 0 };
    room = new Room('r1', 'Classroom 101', 30);
    room.notAvailablePeriods = [notAvailableSlot];

    // Define an available slot
    availableSlot = { day: 0, hour: 9, minute: 0 };

    constraint = new RoomNotAvailable(room);
  });

  it('should be satisfied when no activities are assigned to the room', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when activity is assigned to the room during available periods', () => {
    assignment.assignActivity(activity, availableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when activity is assigned to the room during not available periods', () => {
    assignment.assignActivity(activity, notAvailableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when activity spans over available periods', () => {
    // Create an activity that ends before the not available period
    const morningActivity = new Activity('a2', 'Morning Lecture', subject, 60);
    assignment.assignActivity(morningActivity, availableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when activity spans into not available periods', () => {
    // Create a slot right before the not available period
    const slotBeforeNotAvailable = { day: 0, hour: 13, minute: 30 };

    // Activity with duration that spans into the not available period
    const longActivity = new Activity('a3', 'Long Lecture', subject, 60);
    assignment.assignActivity(longActivity, slotBeforeNotAvailable, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    assignment.assignActivity(activity, notAvailableSlot, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity, availableSlot, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities.length).toBe(1);

    const activity2 = new Activity('a2', 'Another Math Lecture', subject, 60);
    assignment.assignActivity(activity2, availableSlot, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activity);
    constraint.addActivity(activity);

    expect(constraint.activities.length).toBe(1);
  });
});
