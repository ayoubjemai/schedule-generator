import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { TeacherMaxHoursContinouslyInActivityTag } from './TeacherMaxHoursContinouslyInActivityTag';

describe('TeacherMaxHoursContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_HOURS_CONTINUOUSLY = 2;
  const ACTIVITY_TAG_ID = 'lab';

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxHoursContinouslyInActivityTag;
  let room: Room;
  let labTag: ActivityTag;
  let otherTag: ActivityTag;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Chemistry');

    teacher = new Teacher('t1', 'John Doe');
    teacher['minGapsPerDay'] = 30; // 30 minutes gap considered as break

    labTag = new ActivityTag(ACTIVITY_TAG_ID, 'Laboratory');
    otherTag = new ActivityTag('lecture', 'Lecture');

    // Create activities for different days
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Activity ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    // Create activities with different tag
    for (let i = 5; i < 8; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lecture ${i - 4}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(otherTag);
      activities.push(activity);
    }

    room = new Room('r1', 'Laboratory 101', 30);

    constraint = new TeacherMaxHoursContinouslyInActivityTag(
      teacher,
      ACTIVITY_TAG_ID,
      MAX_HOURS_CONTINUOUSLY
    );
  });

  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should use teacher minGapsPerDay value for determining gaps', () => {
    teacher['minGapsPerDay'] = 40; // Override default value
    constraint = new TeacherMaxHoursContinouslyInActivityTag(
      teacher,
      ACTIVITY_TAG_ID,
      MAX_HOURS_CONTINUOUSLY
    );

    // Verify that the MIN_GAP_MINUTES was set correctly
    expect((constraint as any).MIN_GAP_MINUTES).toBe(40);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign 4 consecutive lab activities (exceeds MAX_HOURS_CONTINUOUSLY)
    for (let i = 0; i < 4; i++) {
      assignment.assignActivity(activities[i], { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherTeacherActivity = new Activity('oa1', 'Other Teacher Lab', subject, 60);
    otherTeacherActivity.teachers.push(otherTeacher);
    otherTeacherActivity.activityTags.push(labTag);

    // Assign 3 consecutive lab activities for other teacher
    for (let i = 0; i < 3; i++) {
      const clonedActivity = new Activity(`oa${i + 1}`, `Other Lab ${i + 1}`, subject, 60);
      clonedActivity.teachers.push(otherTeacher);
      clonedActivity.activityTags.push(labTag);
      assignment.assignActivity(clonedActivity, { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }

    // Assign 2 consecutive lab activities for main teacher (within limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Should be satisfied for main teacher, despite other teacher exceeding limit
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);

    expect(constraint.activities.length).toBe(1);
  });
});
