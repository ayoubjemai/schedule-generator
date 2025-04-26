import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MinSpanPerDay } from './MinSpanPerDay';
import { ValidationError } from '../../../../utils/ValidationError';
class TestMinSpanPerDay extends MinSpanPerDay {
  constructor(minSpanHours: number) {
    super(minSpanHours);
  }
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}
describe('MinSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_SPAN_HOURS = 4; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let minSpanPerDay: TestMinSpanPerDay;
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
    minSpanPerDay = new TestMinSpanPerDay(MIN_SPAN_HOURS);
  });
  it('should be valid when no activities are assigned', () => {
    expect(minSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });
  it('should not be valid when only one activity with insufficient span is assigned', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0]])).toBe(false);
  });
  it('should be valid when only one activity with sufficient span is assigned', () => {
    const longActivity = new Activity('long', 'Long Activity', subject, 240);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(minSpanPerDay.testIsValid(assignment, [longActivity])).toBe(true);
  });
  it('should not be valid when span is below minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 30 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should be valid when span is exactly at minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(true);
  });
  it('should be valid when span exceeds minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 30 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should validate each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 15 }, room.id);
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(false);
  });
  it('should work with various activity durations', () => {
    const shortActivity = new Activity('short', 'Short Activity', subject, 30);
    const longActivity = new Activity('long', 'Long Activity', subject, 180);
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 30 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(true);
  });
  it('should handle activities with non-standard start times', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 45 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
  it('should find span based on earliest and latest activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, activities.slice(0, 3))).toBe(true);
    expect(minSpanPerDay.testIsValid(assignment, [activities[1]])).toBe(false);
  });
  it('should handle activities with the same start time correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[2]])).toBe(false);
  });
  it('should handle activities with the same end time correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 30 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should work with different min span values', () => {
    const relaxedConstraint = new TestMinSpanPerDay(2);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(relaxedConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
    const strictConstraint = new TestMinSpanPerDay(6);
    expect(strictConstraint.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
  });
  it('should handle overlapping activities correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 30 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1], activities[2]])).toBe(true);
  });
  it('should handle validation errors gracefully', () => {
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
      minSpanPerDay.testIsValid(mockAssignment as unknown as TimetableAssignment, specialActivities);
    }).not.toThrow(ValidationError);
  });
  it('should ignore unassigned activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(true);
  });
  it('should ignore days with no assigned activities', () => {
    expect(minSpanPerDay.testIsValid(assignment, [])).toBe(true);
  });
  it('should calculate span correctly across day boundaries', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, [activities[0], activities[1]])).toBe(false);
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 12, minute: 0 }, room.id); 
    expect(minSpanPerDay.testIsValid(assignment, activities)).toBe(false);
    const extraActivity = new Activity('a5', 'Activity 5', subject, 60);
    assignment.assignActivity(extraActivity, { day: 1, hour: 13, minute: 0 }, room.id);
    expect(minSpanPerDay.testIsValid(assignment, [...activities, extraActivity])).toBe(true);
  });
});
