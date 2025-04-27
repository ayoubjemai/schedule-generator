import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSet } from '../../../../models/StudentSet';
import { Room } from '../../../../models/Room';
import { ActivityTag } from '../../../../models/ActivityTag';
import { StudentSetMinHoursContinouslyInActivityTag } from './StudentSetMinHoursContinouslyInActivityTag';

describe('StudentSetMinHoursContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS = 2; // 2 hours minimum continuously for activities with the specific tag
  const MIN_GAP_MINUTES = 15; // 15 minutes max gap to still be considered continuous
  const TAG_ID = 'lecture';

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let studentSet: StudentSet;
  let anotherStudentSet: StudentSet;
  let constraint: StudentSetMinHoursContinouslyInActivityTag;
  let room: Room;
  let lectureTag: ActivityTag;
  let labTag: ActivityTag;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    studentSet = new StudentSet('s1', { name: 'Class 1A' });
    anotherStudentSet = new StudentSet('s2', { name: 'Class 1B' });

    lectureTag = new ActivityTag(TAG_ID, 'Lecture');
    labTag = new ActivityTag('lab', 'Laboratory');

    // Create activities of various durations for testing
    activities = [];

    // Lecture activities (with the tag we're tracking)
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lec${i + 1}`, `Math Lecture ${i + 1}`, subject, 60); // 60 minutes
      activity.studentSets.push(studentSet);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }

    // Lab activities (with a different tag)
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`lab${i + 1}`, `Math Lab ${i + 1}`, subject, 60); // 60 minutes
      activity.studentSets.push(studentSet);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    // Activities for another student set
    for (let i = 0; i < 2; i++) {
      const activity = new Activity(`other${i + 1}`, `Other Class Lecture ${i + 1}`, subject, 60);
      activity.studentSets.push(anotherStudentSet);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new StudentSetMinHoursContinouslyInActivityTag(
      studentSet,
      MIN_HOURS,
      TAG_ID,
      MIN_GAP_MINUTES
    );
  });

  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });

  it('should be satisfied when student set has sufficient continuous hours of tagged activities', () => {
    // Assign two consecutive lecture activities (2 hours total)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); // Lecture 2

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when student set has insufficient continuous hours of tagged activities', () => {
    // Assign only one lecture activity (1 hour total)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should not be satisfied when tagged activities are interrupted by non-tagged activities', () => {
    // Assign activities in this order: Lecture, Lab, Lecture
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab 1 (interrupts)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Lecture 2

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when tagged activities have small gaps within the allowed limit', () => {
    // Assign two lecture activities with a small gap (10 minutes < MIN_GAP_MINUTES)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1 (8:00-9:00)
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 10 }, room.id); // Lecture 2 (9:10-10:10)

    // Total continuous time: 2 hours 10 minutes with a 10-minute gap (still considered continuous)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when tagged activities have gaps exceeding the allowed limit', () => {
    // Assign two lecture activities with a gap larger than allowed (20 minutes > MIN_GAP_MINUTES)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1 (8:00-9:00)
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id); // Lecture 2 (9:20-10:20)

    // Gap exceeds MIN_GAP_MINUTES, so these are not considered continuous
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should only consider activities for the specified student set', () => {
    // Assign activities for the target student set with insufficient continuity
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1 (one hour)

    // Assign continuous activities for another student set
    assignment.assignActivity(activities[7], { day: 0, hour: 9, minute: 0 }, room.id); // Other Class Lecture 1
    assignment.assignActivity(activities[8], { day: 0, hour: 10, minute: 0 }, room.id); // Other Class Lecture 2

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should only consider activities with the specified activity tag', () => {
    // Assign a lecture and then a lab activity for the student set
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture (with target tag)
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab (different tag)

    // Only have one hour of lecture activities
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should NOT be satisfied when at least one continuous does not meets the requirement', () => {
    // Day 0: Interrupted lectures (not continuous for 2 hours)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab (interrupts)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Lecture 2

    // Day 1: Continuous lectures (2 hours)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id); // Lecture 3
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 0 }, room.id); // Lecture 4

    // Should be satisfied because Day 1 meets the requirement
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should handle activities with different durations', () => {
    // Create lecture activities with different durations
    const shortLecture = new Activity('short', 'Short Lecture', subject, 30); // 30 minutes
    shortLecture.studentSets.push(studentSet);
    shortLecture.activityTags.push(lectureTag);

    const longLecture = new Activity('long', 'Long Lecture', subject, 90); // 1.5 hours
    longLecture.studentSets.push(studentSet);
    longLecture.activityTags.push(lectureTag);

    // Assign them consecutively to get 2 hours total
    assignment.assignActivity(shortLecture, { day: 0, hour: 8, minute: 0 }, room.id); // 30 min
    assignment.assignActivity(longLecture, { day: 0, hour: 8, minute: 30 }, room.id); // 1.5 hours

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities with the specified tag for the student set', () => {
    // Mix of lecture and lab activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab 1
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Lecture 2

    constraint.isSatisfied(assignment);

    // Should track all activities for the student set
    expect(constraint.activities).toContain(activities[0]); // Lecture
    expect(constraint.activities).toContain(activities[1]); // Lecture
    expect(constraint.activities).not.toContain(activities[5]); // Lab does not contain the containt tag
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);

    expect(constraint.activities.length).toBe(1);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign only one lecture (insufficient hours)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should use getActivitiesForStudentSet from assignment', () => {
    // Spy on getActivitiesForStudentSet
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');

    constraint.isSatisfied(assignment);

    // Verify that it was called with the correct student set ID
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });

  it('should delegate to parent class isValid method with student set activities', () => {
    // Spy on the isValid method
    const spy = jest.spyOn(constraint, 'isValid');

    // Assign some activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    constraint.isSatisfied(assignment);

    // Verify isValid was called with correct parameters
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(assignment);
    expect(Array.isArray(spy.mock.calls[0][1])).toBe(true);
    expect(typeof spy.mock.calls[0][2]).toBe('function');
    expect(spy.mock.calls[0][3]).toBe(MIN_GAP_MINUTES);
  });

  it('should handle activities with multiple student sets', () => {
    // Create an activity that belongs to both student sets
    const sharedActivity = new Activity('shared', 'Shared Lecture', subject, 60);
    sharedActivity.studentSets.push(studentSet);
    sharedActivity.studentSets.push(anotherStudentSet);
    sharedActivity.activityTags.push(lectureTag);

    // Assign the shared activity and another activity continuously
    assignment.assignActivity(sharedActivity, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00

    // Total continuous time: 2 hours
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not treat activities on different days as continuous', () => {
    // Day 0: One hour lecture
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Day 1: One hour lecture
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);

    // Total: 2 hours but not continuous (different days)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
