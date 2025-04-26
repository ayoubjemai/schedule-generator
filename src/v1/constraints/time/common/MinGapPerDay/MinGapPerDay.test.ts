import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { MinGapPerDay } from './MinGapPerDay';
describe('MinGapPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: MinGapPerDay;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); 
      activities.push(activity);
    }
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new MinGapPerDay(MIN_GAP_MINUTES);
  });
  it('should be satisfied when no activities are provided', () => {
    expect(constraint.isValid(assignment, [])).toBe(true);
  });
  it('should be satisfied when only one activity is provided per day', () => {
    for (let day = 0; day < 3; day++) {
      assignment.assignActivity(activities[day], { day, hour: 9, minute: 0 }, room.id);
    }
    expect(constraint.isValid(assignment, activities.slice(0, 3))).toBe(true);
  });
  it('should be satisfied when multiple activities with sufficient gap are assigned', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should not be satisfied when activities have insufficient gap', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should evaluate each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 20 }, room.id);
    expect(constraint.isValid(assignment, activities.slice(0, 4))).toBe(false);
  });
  it('should correctly handle overlapping activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 30 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should check all pairs of activities in a day', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 20 }, room.id);
    expect(constraint.isValid(assignment, activities.slice(0, 3))).toBe(false);
  });
  it('should correctly calculate gap when activities are in different order', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should handle activities with different durations', () => {
    const shortActivity = new Activity('short', 'Short Activity', subject, 30); 
    const longActivity = new Activity('long', 'Long Activity', subject, 120); 
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 20 }, room.id);
    expect(constraint.isValid(assignment, [shortActivity, longActivity])).toBe(true);
  });
  it('should calculate negative gap for completely overlapping activities', () => {
    const longActivity = new Activity('long', 'Long Activity', subject, 120);
    const overlappedActivity = new Activity('overlap', 'Overlapped Activity', subject, 60);
    assignment.assignActivity(longActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(overlappedActivity, { day: 0, hour: 8, minute: 30 }, room.id);
    expect(constraint.isValid(assignment, [longActivity, overlappedActivity])).toBe(false);
  });
  it('should calculate zero gap for back-to-back activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should handle activities on different days correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 20 }, room.id);
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
