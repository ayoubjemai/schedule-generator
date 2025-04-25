import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxSpanPerDay } from './MaxSpanPerDay';
import { ValidationError } from '../../../../utils/ValidationError';

// Create a test implementation of MaxSpanPerDay for testing
class TestMaxSpanPerDay extends MaxSpanPerDay {
  constructor(maxSpanHours: number) {
    super(maxSpanHours);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MaxSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_SPAN_HOURS = 6; // 6 hours maximum span

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxSpanPerDay: TestMaxSpanPerDay;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities with different durations
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), // 1 hour
      new Activity('a2', 'Activity 2', subject, 90), // 1.5 hours
      new Activity('a3', 'Activity 3', subject, 120), // 2 hours
      new Activity('a4', 'Activity 4', subject, 45), // 0.75 hours
    ];

    room = new Room('r1', 'Classroom 101', 30);

    maxSpanPerDay = new TestMaxSpanPerDay(MAX_SPAN_HOURS);
  });

  it('should be valid when no activities are assigned', () => {
    expect(maxSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });

  it('should be valid when only one activity is assigned', () => {
    // Assign a single activity
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(maxSpanPerDay.testIsValid(assignment, [activities[0]])).toBe(true);
  });

  it('should be valid when span is below maximum', () => {
    // Assign activities with a 4-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-13:30

    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should be valid when span is exactly at maximum', () => {
    // Assign activities with exactly 6-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-14:00

    // Span: 8:00 to 14:00 = 6 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });

  it('should not be valid when span exceeds maximum', () => {
    // Assign activities with 7-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 30 }, room.id); // 13:30-15:00

    // Span: 8:00 to 15:00 = 7 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should validate each day independently', () => {
    // Day 0: 5-hour span (within limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id);

    // Day 1: 7-hour span (exceeds limit)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 14, minute: 15 }, room.id);

    // Should fail due to day 1 exceeding limit
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });

  it('should work with various activity durations', () => {
    // Create activities with different durations
    const shortActivity = new Activity('short', 'Short Activity', subject, 30);
    const longActivity = new Activity('long', 'Long Activity', subject, 180);

    // 5.5-hour span: 8:00 to 13:30
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-8:30
    assignment.assignActivity(longActivity, { day: 0, hour: 10, minute: 30 }, room.id); // 10:30-13:30

    expect(maxSpanPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(true);
  });

  it('should handle activities with non-standard start times', () => {
    // Activities with odd starting times
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); // 8:15-9:15
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 45 }, room.id); // 13:45-15:15

    // Span: 8:15 to 15:15 = 7 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should find span based on earliest and latest activities', () => {
    // Three activities with the first and last ones determining the span
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:30
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-14:00

    // Span: 8:00 to 14:00 = 6 hours (at the limit)
    expect(maxSpanPerDay.testIsValid(assignment, activities.slice(0, 3))).toBe(true);

    // Add another activity that extends the span
    assignment.assignActivity(activities[3], { day: 0, hour: 14, minute: 30 }, room.id); // 14:30-15:15

    // New span: 8:00 to 15:15 = 7.25 hours (exceeds limit)
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });

  it('should handle activities with the same start time correctly', () => {
    // Two activities starting at the same time but with different durations
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-11:00

    // Span should be 9:00 to 11:00 = 2 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });

  it('should handle activities with the same end time correctly', () => {
    // Two activities ending at the same time but with different durations
    assignment.assignActivity(activities[0], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-13:00
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id); // 11:30-13:00

    // Span should be 11:30 to 13:00 = 1.5 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should work with different max span values', () => {
    // Create a constraint with a more restrictive span limit
    const strictConstraint = new TestMaxSpanPerDay(3);

    // Span: 9:00 to 12:30 = 3.5 hours (exceeds 3-hour limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);

    expect(strictConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);

    // Create a constraint with a more permissive span limit
    const relaxedConstraint = new TestMaxSpanPerDay(8);

    // Should now be valid with the 8-hour limit
    expect(relaxedConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should handle overlapping activities correctly', () => {
    // Activities that overlap in time
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 30 }, room.id); // 9:30-11:00

    // Span should be 9:00 to 11:00 = 2 hours
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should not throw ValidationError even the activities lead to negative duration because of sortActivitiesByTime', () => {
    // We need to create a situation that would lead to a negative duration
    // This could happen with data corruption or time calculation errors

    // Mock the TimetableAssignment to return slots that would cause validation error
    const mockAssignment = {
      getSlotForActivity: jest.fn().mockImplementation(id => {
        if (id === 'a1') {
          return { day: 0, hour: 11, minute: 0 }; // Later time
        } else {
          return { day: 0, hour: 9, minute: 0 }; // Earlier time but treated as end time
        }
      }),
      getAllAssignedActivities: jest.fn().mockReturnValue([activities[0], activities[1]]),
      getActivitiesForDay: jest.fn(),
    };

    // Create special activities with IDs that match our mock
    const specialActivities = [
      new Activity('a1', 'Activity 1', subject, 60),
      new Activity('a2', 'Activity 2', subject, 60),
    ];

    // The test should detect that our sorting or duration calculation will lead to errors
    expect(() => {
      maxSpanPerDay.testIsValid(mockAssignment as unknown as TimetableAssignment, specialActivities);
    }).not.toThrow(ValidationError);
  });

  it('should ignore unassigned activities', () => {
    // Assign only some activities
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);

    // Pass all activities including unassigned ones
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(true);
  });

  it('should calculate span correctly across day boundaries', () => {
    // Activities on different days
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // Day 0
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); // Day 1

    // Should be valid since each day's span is separately calculated
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
