import { validatePayload } from '../helpers/validatePayload';
import payload from '../../test.json';
import { Constraint } from './types/constraints';
import { ActivitiesNotOverlapping } from './constraints';
import { Teacher } from './models/Teacher';
import Subject from './models/Subject';
import { StudentSet } from './models/StudentSet';
import { Room } from './models/Room';
import { Activity } from './models/Activity';
import { ValidationError } from './utils/ValidationError';
import { TimetableScheduler } from './scheduler/TimetableScheduler';
import { renderConsoleTimetable } from './utils/renderConsoleTimetable';
import { logToFile } from './utils/logToFile';

try {
  const data = validatePayload.parse(payload);
  const { dayCount, periodsPerDay } = data;
  const constraints: Constraint[] = [new ActivitiesNotOverlapping()];

  const teachers = data.teachers.map(teacher => {
    const { id, name } = teacher;
    return new Teacher(id, name);
  });

  const subjects = data.subjects.map(subject => {
    const { id, name } = subject;
    return new Subject(id, name);
  });

  const classes = data.classes.map(classData => {
    const { id, name } = classData;
    return new StudentSet(id, { name });
  });

  const rooms = data.rooms.map(room => {
    const { id, name } = room;
    return new Room(id, name, 20);
  });

  const activities = data.activities.map(activity => {
    const {
      id,
      name,
      preferredStartingTimes,
      teachers: teacherIds,
      classes: studentSetIds,
      preferredRooms,
    } = activity;
    const teacherInActivities = teacherIds.map(teacherId => {
      const teacher = teachers.find(teacher => teacher.get('id') === teacherId);
      if (!teacher) throw new ValidationError(`Teacher with id ${teacherId} not found`);
      return teacher;
    });
    const studentSets = studentSetIds.map(studentSetId => {
      const selectedClass = classes.find(classData => classData.id === studentSetId);
      if (!selectedClass) throw new ValidationError(`StudentSet with id ${studentSetId} not found`);
      return selectedClass;
    });

    const subject = subjects.find(subject => subject.id === activity.subject);
    if (!subject) throw new ValidationError(`Subject with id ${activity.subject} not found`);

    preferredRooms?.forEach(roomId => {
      const room = rooms.find(room => room.id === roomId);
      if (!room) throw new ValidationError(`Room with id ${roomId} not found`);
    });

    const activityInstance = new Activity(id, name, subject, activity.totalDurationInMinutes);

    activityInstance.teachers.push(...teacherInActivities);
    activityInstance.studentSets.push(...studentSets);
    activityInstance.preferredRooms.push(...(preferredRooms || []));

    preferredStartingTimes && activityInstance.preferredStartingTimes.push(...preferredStartingTimes);

    return activityInstance;
  });

  const scheduler = new TimetableScheduler(data.dayCount, data.periodsPerDay, 1234);

  rooms.forEach(room => {
    scheduler.addRoom(room);
  });

  activities.forEach(activity => {
    scheduler.addActivity(activity);
  });

  constraints.forEach(constraint => {
    scheduler.addTimeConstraint(constraint);
  });

  const assignment = scheduler.generateSchedule();
  console.log('\nGenerated Timetable:');

  renderConsoleTimetable(assignment, dayCount, periodsPerDay);
  const { teacherSchedules, studentSetSchedules, roomSchedules } = scheduler.exportSchedule(assignment);
  logToFile('schedule', { teacherSchedules, studentSetSchedules, roomSchedules });

  const violations = scheduler.analyzeConstraintViolations(assignment);
  if (Object.keys(violations).length > 0) {
    console.log('\nConstraint Violations:');
    console.log(violations);
  } else {
    console.log('\nNo constraint violations detected!');
  }
} catch (error) {
  console.dir(error, { depth: 10, colors: true });
}
