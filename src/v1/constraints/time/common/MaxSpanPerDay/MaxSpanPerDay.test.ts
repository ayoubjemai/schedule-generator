import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxSpanPerDay } from './MaxSpanPerDay';
import { ValidationError } from '../../../../utils/ValidationError';
class TestMaxSpanPerDay extends MaxSpanPerDay {
  constructor(maxSpanHours: number) {
    super(maxSpanHours);
  }
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}
describe('MaxSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_SPAN_HOURS = 6; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxSpanPerDay: TestMaxSpanPerDay;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), 
      new Activity('a2', 'Activity 2', subject, 90), 
      new Activity('a3', 'Activity 3', subject, 120), 
      new Activity('a4', 'Activity 4', subject, 45), 
    ];
    room = new Room('r1', 'Classroom 101', 30);
    maxSpanPerDay = new TestMaxSpanPerDay(MAX_SPAN_HOURS);
  });
  it('should be valid when no activities are assigned', () => {
    expect(maxSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });
  it('should be valid when only one activity is assigned', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0]])).toBe(true);
  });
  it('should be valid when span is below maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should be valid when span is exactly at maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });
  it('should not be valid when span exceeds maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 30 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should validate each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 14, minute: 15 }, room.id);
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });
  it('should work with various activity durations', () => {
    const shortActivity = new Activity('short', 'Short Activity', subject, 30);
    const longActivity = new Activity('long', 'Long Activity', subject, 180);
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(longActivity, { day: 0, hour: 10, minute: 30 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(true);
  });
  it('should handle activities with non-standard start times', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 45 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should find span based on earliest and latest activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, activities.slice(0, 3))).toBe(true);
    assignment.assignActivity(activities[3], { day: 0, hour: 14, minute: 30 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });
  it('should handle activities with the same start time correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });
  it('should handle activities with the same end time correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should work with different max span values', () => {
    const strictConstraint = new TestMaxSpanPerDay(3);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);
    expect(strictConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
    const relaxedConstraint = new TestMaxSpanPerDay(8);
    expect(relaxedConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should handle overlapping activities correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 30 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should not throw ValidationError even the activities lead to negative duration because of sortActivitiesByTime', () => {
    const mockAssignment = {
      getSlotForActivity: jest.fn().mockImplementation(id => {
        if (id === 'a1') {
          return { day: 0, hour: 11, minute: 0 }; 
        } else {
          return { day: 0, hour: 9, minute: 0 }; 
        }
      }),
      getAllAssignedActivities: jest.fn().mockReturnValue([activities[0], activities[1]]),
      getActivitiesForDay: jest.fn(),
    };
    const specialActivities = [
      new Activity('a1', 'Activity 1', subject, 60),
      new Activity('a2', 'Activity 2', subject, 60),
    ];
    expect(() => {
      maxSpanPerDay.testIsValid(mockAssignment as unknown as TimetableAssignment, specialActivities);
    }).not.toThrow(ValidationError);
  });
  it('should ignore unassigned activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);
    expect(maxSpanPerDay.testIsValid(assignment, activities)).toBe(true);
  });
  it('should calculate span correctly across day boundaries', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(maxSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
