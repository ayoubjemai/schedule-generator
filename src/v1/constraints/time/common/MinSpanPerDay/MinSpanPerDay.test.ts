import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MinSpanPerDay } from './MinSpanPerDay';
import { ValidationError } from '../../../../utils/ValidationError';

// Create a test implementation of MinSpanPerDay for testing
class TestMinSpanPerDay extends MinSpanPerDay {
  constructor(minSpanHours: number) {
    super(minSpanHours);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MinSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_SPAN_HOURS = 4; // 4 hours minimum span

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let minSpanPerDay: TestMinSpanPerDay;

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

    minSpanPerDay = new TestMinSpanPerDay(MIN_SPAN_HOURS);
  });

  it('should be valid when no activities are assigned', () => {
    // No activities means minimum span requirement doesn't apply
    expect(minSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });

  it('should not be valid when only one activity with insufficient span is assigned', () => {
    // Assign a single activity with duration less than minimum span
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour < 4 hours

    expect(minSpanPerDay.testIsValid(assignment, [activities[0]])).toBe(false);
  });

  it('should be valid when only one activity with sufficient span is assigned', () => {
    // Create a long activity (4 hours)
    const longActivity = new Activity('long', 'Long Activity', subject, 240);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);

    expect(minSpanPerDay.testIsValid(assignment, [longActivity])).toBe(true);
  });

  it('should not be valid when span is below minimum', () => {
    // Assign activities with a 3-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 30 }, room.id); // 10:30-12:00

    // Span: 9:00 to 12:00 = 3 hours (below 4-hour minimum)
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should be valid when span is exactly at minimum', () => {
    // Assign activities with exactly 4-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-12:00

    // Span: 8:00 to 12:00 = 4 hours
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });

  it('should be valid when span exceeds minimum', () => {
    // Assign activities with 6-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 30 }, room.id); // 12:30-14:00

    // Span: 8:00 to 14:00 = 6 hours
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should validate each day independently', () => {
    // Day 0: 5-hour span (above minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id);

    // Day 1: 3-hour span (below minimum)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 15 }, room.id);

    // Should fail due to day 1 being below minimum span
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });

  it('should work with various activity durations', () => {
    // Create activities with different durations
    const shortActivity = new Activity('short', 'Short Activity', subject, 30);
    const longActivity = new Activity('long', 'Long Activity', subject, 180);

    // 4.5-hour span: 8:00 to 12:30
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-8:30
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 30 }, room.id); // 9:30-12:30

    expect(minSpanPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(true);
  });

  it('should handle activities with non-standard start times', () => {
    // Activities with odd starting times
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); // 8:15-9:15
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 45 }, room.id); // 10:45-12:15

    // Span: 8:15 to 12:15 = 4 hours
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });

  it('should find span based on earliest and latest activities', () => {
    // Three activities with the first and last ones determining the span
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:30
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-13:00

    // Span: 8:00 to 13:00 = 5 hours (above minimum)
    expect(minSpanPerDay.testIsValid(assignment, activities.slice(0, 3))).toBe(true);

    // Try with only the middle activities that have a narrower span
    // Span: 10:00 to 11:30 = 1.5 hours (below minimum)
    expect(minSpanPerDay.testIsValid(assignment, [activities[1]])).toBe(false);
  });

  it('should handle activities with the same start time correctly', () => {
    // Two activities starting at the same time but with different durations
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-11:00

    // Span should be 9:00 to 11:00 = 2 hours (below minimum)
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(false);
  });

  it('should handle activities with the same end time correctly', () => {
    // Two activities ending at the same time but with different durations
    assignment.assignActivity(activities[0], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-13:00
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id); // 11:30-13:00

    // Span should be 11:30 to 13:00 = 1.5 hours (below minimum)
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should work with different min span values', () => {
    // Create a constraint with a less restrictive span requirement
    const relaxedConstraint = new TestMinSpanPerDay(2);

    // Span: 9:00 to 11:30 = 2.5 hours (exceeds 2-hour minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(relaxedConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);

    // Create a constraint with a more restrictive span requirement
    const strictConstraint = new TestMinSpanPerDay(6);

    // Should now be invalid with the 6-hour minimum
    expect(strictConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });

  it('should handle overlapping activities correctly', () => {
    // Activities that overlap in time
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 30 }, room.id); // 9:30-11:00
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-14:00

    // Span should be 9:00 to 14:00 = 5 hours (above minimum)
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1], activities[2]])).toBe(true);
  });

  it('should handle validation errors gracefully', () => {
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

    // The test should not throw when our duration calculation encounters issues
    expect(() => {
      minSpanPerDay.testIsValid(mockAssignment as unknown as TimetableAssignment, specialActivities);
    }).not.toThrow(ValidationError);
  });

  it('should ignore unassigned activities', () => {
    // Assign only some activities
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);

    // Pass all activities including unassigned ones, but only assigned ones should be considered
    // Span: 9:00 to 13:30 = 4.5 hours (above minimum)
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(true);
  });

  it('should ignore days with no assigned activities', () => {
    // No activities assigned for day 0, so that day shouldn't be evaluated
    expect(minSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });

  it('should calculate span correctly across day boundaries', () => {
    // Activities on different days
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // Day 0, 1 hour span (below minimum)
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); // Day 1, 1.5 hour span (below minimum)

    // Both days have spans below the minimum, so constraint should not be satisfied
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);

    // Now add activities to create sufficient span on both days
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); // Day 0, now 9:00-14:00 = 5 hours
    assignment.assignActivity(activities[3], { day: 1, hour: 12, minute: 0 }, room.id); // Day 1, now 9:00-12:45 = 3.75 hours (still below min)

    // Day 1 still below minimum, so should not be satisfied
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(false);

    // Create one more activity to extend Day 1's span
    const extraActivity = new Activity('a5', 'Activity 5', subject, 60);
    assignment.assignActivity(extraActivity, { day: 1, hour: 13, minute: 0 }, room.id);

    // Now both days have sufficient span
    expect(minSpanPerDay.testIsValid(assignment, [...activities, extraActivity])).toBe(true);
  });
});
