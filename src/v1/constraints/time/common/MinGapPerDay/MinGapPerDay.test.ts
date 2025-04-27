import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { MinGapPerDay } from './MinGapPerDay';

describe('MinGapPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; // 30 minutes minimum gap between activities

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: MinGapPerDay;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities for testing
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); // Each activity is 60 minutes
      activities.push(activity);
    }

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new MinGapPerDay(MIN_GAP_MINUTES);
  });

  it('should be satisfied when no activities are provided', () => {
    expect(constraint.isValid(assignment, [])).toBe(true);
  });

  it('should be satisfied when only one activity is provided per day', () => {
    // Assign one activity per day for three days
    for (let day = 0; day < 3; day++) {
      assignment.assignActivity(activities[day], { day, hour: 9, minute: 0 }, room.id);
    }

    expect(constraint.isValid(assignment, activities.slice(0, 3))).toBe(true);
  });

  it('should be satisfied when multiple activities with sufficient gap are assigned', () => {
    // Day 0: Two activities with 60 minutes gap (greater than MIN_GAP_MINUTES)
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 10:00-11:00 (60 minutes gap after Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should not be satisfied when activities have insufficient gap', () => {
    // Day 0: Two activities with only 20 minutes gap (less than MIN_GAP_MINUTES)
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 9:20-10:20 (20 minutes gap after Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id);

    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should evaluate each day independently', () => {
    // Day 0: Activities with sufficient gap (60 minutes)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: Activities with insufficient gap (20 minutes)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 20 }, room.id);

    // Overall constraint should not be satisfied because of Day 1
    expect(constraint.isValid(assignment, activities.slice(0, 4))).toBe(false);
  });

  it('should correctly handle overlapping activities', () => {
    // Two overlapping activities
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 8:30-9:30 (overlaps with Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 30 }, room.id);

    // Overlapping activities have a gap of 0, which is less than MIN_GAP_MINUTES
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should check all pairs of activities in a day', () => {
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 10:00-11:00 (60 minutes gap after Activity 1 - sufficient)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    // Activity 3: 11:20-12:20 (20 minutes gap after Activity 2 - insufficient)
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 20 }, room.id);

    // Even though the gap between Activity 1 and 2 is sufficient,
    // the gap between Activity 2 and 3 is insufficient
    expect(constraint.isValid(assignment, activities.slice(0, 3))).toBe(false);
  });

  it('should correctly calculate gap when activities are in different order', () => {
    // Activities assigned out of chronological order
    // Activity 2: 10:00-11:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    // Activity 1: 8:00-9:00 (added later but happens earlier)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Gap should still be correctly calculated as 60 minutes
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should handle activities with different durations', () => {
    // Create activities with different durations
    const shortActivity = new Activity('short', 'Short Activity', subject, 30); // 30 minutes
    const longActivity = new Activity('long', 'Long Activity', subject, 120); // 2 hours

    // Short activity: 8:00-8:30
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    // Long activity: 9:20-11:20 (50 minutes gap after short activity - sufficient)
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 20 }, room.id);

    expect(constraint.isValid(assignment, [shortActivity, longActivity])).toBe(true);
  });

  it('should calculate negative gap for completely overlapping activities', () => {
    // Activity 1: 8:00-10:00 (2 hours)
    const longActivity = new Activity('long', 'Long Activity', subject, 120);
    // Activity 2: 8:30-9:30 (1 hour, completely inside the time span of Activity 1)
    const overlappedActivity = new Activity('overlap', 'Overlapped Activity', subject, 60);

    assignment.assignActivity(longActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(overlappedActivity, { day: 0, hour: 8, minute: 30 }, room.id);

    expect(constraint.isValid(assignment, [longActivity, overlappedActivity])).toBe(false);
  });

  it('should calculate zero gap for back-to-back activities', () => {
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 9:00-10:00 (exactly back to back, 0 gap)
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should handle activities on different days correctly', () => {
    // Activity 1: Day 0, 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: Day 1, 8:20-9:20 (on a different day, should be evaluated separately)
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 20 }, room.id);

    // No insufficient gaps since activities are on different days
    expect(constraint.isValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
