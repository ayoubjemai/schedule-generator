import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxConsecutiveHours } from './MaxConsecutiveHours';

// Create a test implementation of MaxConsecutiveHours for testing
class TestMaxConsecutiveHours extends MaxConsecutiveHours {
  constructor(maxHours: number, minGapBeteweenActivity = 0) {
    super(maxHours, minGapBeteweenActivity);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MaxConsecutiveHours', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_CONSECUTIVE_HOURS = 4; // 4 hours max consecutive

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxConsecutiveHours: TestMaxConsecutiveHours;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities with different durations
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), // 1 hour
      new Activity('a2', 'Activity 2', subject, 120), // 2 hours
      new Activity('a3', 'Activity 3', subject, 90), // 1.5 hours
      new Activity('a4', 'Activity 4', subject, 180), // 3 hours
      new Activity('a5', 'Activity 5', subject, 45), // 0.75 hours
    ];

    room = new Room('r1', 'Classroom 101', 30);

    maxConsecutiveHours = new TestMaxConsecutiveHours(MAX_CONSECUTIVE_HOURS);
  });

  it('should be valid when no activities are assigned', () => {
    expect(maxConsecutiveHours.testIsValid(assignment, [])).toBe(true);
  });

  it('should be valid when only one activity is assigned', () => {
    // Assign a single activity (3 hours)
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(maxConsecutiveHours.testIsValid(assignment, [activities[3]])).toBe(true);
  });

  it('should be valid when consecutive activities are within limit', () => {
    // Assign consecutive activities (2 + 1.5 = 3.5 hours, below 4 hour limit)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00 (2h)
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:30 (1.5h)

    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[2]])).toBe(true);
  });

  it('should be valid when consecutive activities equal the limit', () => {
    // Assign consecutive activities (1 + 3 = 4 hours, at the limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00 (1h)
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-12:00 (3h)

    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[3]])).toBe(true);
  });

  it('should not be valid when consecutive activities exceed the limit', () => {
    // Assign consecutive activities (2 + 3 = 5 hours, exceeds 4 hour limit)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00 (2h)
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-13:00 (3h)

    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(false);
  });

  it('should be valid when activities have gaps between them', () => {
    // Assign activities with a gap (2h at 8:00, then 3h at 11:00 - 1 hour gap in between)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00 (2h)
    assignment.assignActivity(activities[3], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-14:00 (3h)

    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(true);
  });

  it('should handle multiple sets of consecutive activities in a day', () => {
    // Morning block: 2h + 1h = 3h (8:00-11:00)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00 (2h)
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:00 (1h)

    // 2-hour gap

    // Afternoon block: 1.5h + 0.75h = 2.25h (13:00-15:15)
    assignment.assignActivity(activities[2], { day: 0, hour: 13, minute: 0 }, room.id); // 13:00-14:30 (1.5h)
    assignment.assignActivity(activities[4], { day: 0, hour: 14, minute: 30 }, room.id); // 14:30-15:15 (0.75h)

    // Each block is under the limit
    expect(maxConsecutiveHours.testIsValid(assignment, activities.slice(0, 5))).toBe(true);
  });

  it('should handle activities on different days', () => {
    // Day 0: 3h consecutive (within limit)
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id);

    // Day 1: 2h + 2h = 4h consecutive (at limit)
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 11, minute: 0 }, room.id); // Another 2h activity

    // Day 2: 3h + 2h = 5h consecutive (exceeds limit)
    assignment.assignActivity(activities[3], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 2, hour: 12, minute: 0 }, room.id);

    // Should fail due to Day 2 exceeding limit
    expect(maxConsecutiveHours.testIsValid(assignment, activities)).toBe(false);
  });

  it('should consider minGapBetweenActivity parameter', () => {
    // Create a constraint that considers activities consecutive if gap ≤ 30 minutes
    const constraintWithGap = new TestMaxConsecutiveHours(MAX_CONSECUTIVE_HOURS, 30);

    // Activities with 30-min gap: 2h + 30min gap + 3h = 5.5h "consecutive" (exceeds limit)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00 (2h)
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 30 }, room.id); // 10:30-13:30 (3h)

    // Should fail because the 30-min gap is considered part of consecutive time
    expect(constraintWithGap.testIsValid(assignment, [activities[1], activities[3]])).toBe(false);

    // But with the default constraint (minGapBetweenActivity = 0), this is valid
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(true);
  });

  it('should handle activities with different starting times', () => {
    // Non-standard starting times
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); // 8:15-9:15 (1h)
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 15 }, room.id); // 9:15-10:45 (1.5h)
    assignment.assignActivity(activities[4], { day: 0, hour: 10, minute: 45 }, room.id); // 10:45-11:30 (0.75h)

    // Total: 3.25 hours consecutive (within limit)
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[2], activities[4]])).toBe(
      true
    );
  });

  it('should handle overlapping activities correctly', () => {
    // Create two overlapping activities
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-11:00 (2h)
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:00 (1h)

    // The calculation should handle the overlap correctly
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
