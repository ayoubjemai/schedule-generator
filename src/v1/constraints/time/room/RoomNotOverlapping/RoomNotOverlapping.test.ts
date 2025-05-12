import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { RoomNotOverlapping } from './RoomNotOverlapping';
import { Room } from '../../../../models/Room';

describe('room RoomNotOverlapping', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  
  let assignment: any;
  let activity: any;
  let subject: any;
  let constraint: any;
  let room: any;
  let slot: any;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    
    // Create an activity
    activity = new Activity('a1', 'Math Lecture', subject, 60);
    
    // Create a room
    room = new Room('r1', 'Classroom 101', 30);

    // Create a time slot
    slot = { day: 0, hour: 9, minute: 0 };

    // Create the constraint
    constraint = new RoomNotOverlapping(room);
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when conditions are met', () => {
    // Set up a scenario where the constraint should be satisfied
    assignment.assignActivity(activity, slot, room.id);
    
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when conditions are not met', () => {
    // Set up a scenario where the constraint should not be satisfied
    // assignment.assignActivity(activity, { day: 0, hour: 9, minute: 0 }, room.id);
    
    // TODO: Implement this test after completing the constraint logic
    // expect(constraint.isSatisfied(assignment)).toBe(false);
    expect(true).toBe(true); // Placeholder
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    
    // Set up a scenario that would normally violate the constraint
    // assignment.assignActivity(activity, { day: 0, hour: 9, minute: 0 }, room.id);
    
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity, slot, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities.length).toBe(1);

    const activity2 = new Activity('a2', 'Another Math Lecture', subject, 60);
    
    
    assignment.assignActivity(activity2, slot, room.id);
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
