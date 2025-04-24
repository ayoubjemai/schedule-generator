import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { TeacherMinHourContinouslyInActivityTag } from './TeacherMinHourContinouslyInActivityTag';

describe('TeacherMinHourContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_CONTINUOUS_HOURS = 2; // 2 hours (120 minutes) minimum continuously for activities with the specific tag
  const TAG_ID = 'lecture';

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinHourContinouslyInActivityTag;
  let room: Room;
  let lectureTag: ActivityTag;
  let labTag: ActivityTag;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Physics');
    teacher = new Teacher('t1', 'John Doe');

    lectureTag = new ActivityTag(TAG_ID, 'Lecture');
    labTag = new ActivityTag('lab', 'Laboratory');

    // Create activities of various durations for testing
    activities = [];

    // Lecture activities (with the tag we're tracking)
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lec${i + 1}`, `Physics Lecture ${i + 1}`, subject, 60); // 60 minutes
      activity.teachers.push(teacher);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }

    // Lab activities (with a different tag)
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lab${i + 1}`, `Physics Lab ${i + 1}`, subject, 60); // 60 minutes
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    room = new Room('r1', 'Physics Classroom', 30);

    constraint = new TeacherMinHourContinouslyInActivityTag(teacher, MIN_CONTINUOUS_HOURS, TAG_ID);
  });

  it('should be satisfied when teacher has sufficient continuous hours of tagged activities', () => {
    // Day 0: 2 continuous hours of lecture activities (satisfies requirement)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); // Lecture 2

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when continuous tagged activities are less than required minimum', () => {
    // Day 0: Only 1 hour of lecture activity (below minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should not be satisfied when tagged activities are interrupted by non-tagged activities', () => {
    // Day 0: Lecture, Lab, Lecture - not continuous lecture activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab 1 (interrupts continuous lectures)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Lecture 2

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should be NOT satisfied when there's at least one continuous block meeting the requirement", () => {
    // Day 0: Lecture, Lecture (2 hours continuous, satisfies requirement)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); // Lecture 2

    // Day 1: Lecture, Lab, Lecture (non-continuous lectures, but doesn't matter since Day 0 satisfies)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id); // Lecture 3
    assignment.assignActivity(activities[5], { day: 1, hour: 9, minute: 0 }, room.id); // Lab 1
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 0 }, room.id); // Lecture 4

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should handle activities with different durations', () => {
    // Create lecture activities with different durations
    const shortLecture = new Activity('short', 'Short Lecture', subject, 30); // 30 minutes
    shortLecture.teachers.push(teacher);
    shortLecture.activityTags.push(lectureTag);

    const longLecture = new Activity('long', 'Long Lecture', subject, 90); // 90 minutes
    longLecture.teachers.push(teacher);
    longLecture.activityTags.push(lectureTag);

    // 30 + 90 = 120 minutes of continuous lecture activities (satisfies requirement)
    assignment.assignActivity(shortLecture, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longLecture, { day: 0, hour: 8, minute: 30 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities with the specified tag', () => {
    // Mix of lecture and lab activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lecture 1
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lab 1
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Lecture 2

    constraint.isSatisfied(assignment);

    // Should only include the lecture activities with the specified tag
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities).not.toContain(activities[5]);
    expect(constraint.activities.length).toBe(2);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);

    expect(constraint.activities.length).toBe(1);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign only 1 hour of lecture activity (below minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');

    // Create activities for other teacher
    const otherTeacherLecture1 = new Activity('otl1', 'Other Teacher Lecture 1', subject, 60);
    otherTeacherLecture1.teachers.push(otherTeacher);
    otherTeacherLecture1.activityTags.push(lectureTag);

    const otherTeacherLecture2 = new Activity('otl2', 'Other Teacher Lecture 2', subject, 60);
    otherTeacherLecture2.teachers.push(otherTeacher);
    otherTeacherLecture2.activityTags.push(lectureTag);

    // Assign continuous hours for other teacher
    assignment.assignActivity(otherTeacherLecture1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherTeacherLecture2, { day: 0, hour: 9, minute: 0 }, room.id);

    // Assign insufficient hours for main teacher
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); // Only 1 hour

    // Should not be satisfied for main teacher
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when activities are on different days but each day has continuous requirement met', () => {
    // Day 0: 2 continuous hours of lecture activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Day 1: 2 continuous hours of lecture activities
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not treat activities on different days as continuous', () => {
    // Day 0: 1 hour lecture
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Day 1: 1 hour lecture
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);

    // 2 hours total, but not continuous since they're on different days
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should handle multiple continuous blocks in the same day', () => {
    // Day 0: Morning block - 2 continuous hours
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Day 0: Afternoon block - 2 continuous hours (after a gap)
    assignment.assignActivity(activities[2], { day: 0, hour: 13, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 14, minute: 0 }, room.id);

    // Has at least one continuous block meeting the requirement
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
