// filepath: /generate-schedule/generate-schedule/src/scheduler/TimetableScheduler.ts
import { TimetableAssignment } from './TimetableAssignment';
import { Activity } from '../models/Activity';
import { Room } from '../models/Room';
import {
  ActivityScheduleItem,
  RoomScheduleExport,
  ScheduleExport,
  StudentSetScheduleExport,
  TeacherScheduleExport,
} from '../types/core';
import { Teacher } from '../models/Teacher';
import { StudentSet } from '../models/StudentSet';
import { Constraint } from '../types/constraints';
import { Period } from '../types/core';
import { convertMinutesToHoursAndMinutes } from '../utils/convertMinutesToHoursAndMinutes';

class TimetableScheduler {
  private activities: Activity[] = [];
  private timeConstraints: Constraint[] = [];
  private spaceConstraints: Constraint[] = [];
  private rooms: Room[] = [];

  constructor(private daysCount: number, private periodsPerDay: number, private randomSeed = 123456) {}

  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }

  addTimeConstraint(constraint: Constraint): void {
    this.timeConstraints.push(constraint);
  }

  addSpaceConstraint(constraint: Constraint): void {
    this.spaceConstraints.push(constraint);
  }

  addRoom(room: Room): void {
    this.rooms.push(room);
  }

  private random(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private evaluateConstraint(constraint: Constraint, assignment: TimetableAssignment): number {
    if (!constraint.active) return 100;
    return constraint.isSatisfied(assignment) ? 100 : 0;
  }

  private evaluateSchedule(assignment: TimetableAssignment): number {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const constraint of this.timeConstraints) {
      const weight = constraint.weight;
      totalWeight += weight;
      const score = this.evaluateConstraint(constraint, assignment);
      weightedScore += score * weight;
    }

    for (const constraint of this.spaceConstraints) {
      const weight = constraint.weight;
      totalWeight += weight;
      const score = this.evaluateConstraint(constraint, assignment);
      weightedScore += score * weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private generateInitialSchedule(): TimetableAssignment {
    const assignment = new TimetableAssignment(this.daysCount, this.periodsPerDay);
    const sortedActivities = [...this.activities].sort((a, b) => {
      const aConstraintLevel =
        a.teachers.length +
        a.studentSets.length +
        a.totalDurationInMinutes +
        (a.preferredTimeSlots.length > 0 ? 1 : 0);
      const bConstraintLevel =
        b.teachers.length +
        b.studentSets.length +
        b.totalDurationInMinutes +
        (b.preferredTimeSlots.length > 0 ? 1 : 0);
      return bConstraintLevel - aConstraintLevel;
    });

    for (const activity of sortedActivities) {
      let placed = false;

      if (activity.preferredStartingTime) {
        const room = this.findSuitableRoom(activity);
        if (room && this.canPlaceActivity(activity, activity.preferredStartingTime, room.id, assignment)) {
          assignment.assignActivity(activity, activity.preferredStartingTime, room.id);
          placed = true;
        }
      }

      if (!placed && activity.preferredStartingTimes.length > 0) {
        for (const time of activity.preferredStartingTimes) {
          const room = this.findSuitableRoom(activity);
          if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
            assignment.assignActivity(activity, time, room.id);
            placed = true;
            break;
          }
        }
      }

      if (!placed && activity.preferredTimeSlots.length > 0) {
        for (const time of activity.preferredTimeSlots) {
          const room = this.findSuitableRoom(activity);
          if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
            assignment.assignActivity(activity, time, room.id);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        const possibleTimes: Period[] = [];
        for (let day = 0; day < this.daysCount; day++) {
          const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
          for (let hour = 0; hour <= this.periodsPerDay - hours; hour++) {
            for (let min = 0; min < 60 - minutes; min++) {
              possibleTimes.push({ day, hour, minute: min });
            }
          }
        }

        const shuffledPeriod = this.shuffle(possibleTimes);

        for (const period of shuffledPeriod) {
          const room = this.findSuitableRoom(activity);
          if (room && this.canPlaceActivity(activity, period, room.id, assignment)) {
            assignment.assignActivity(activity, period, room.id);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        console.warn(`Could not place activity ${activity.id}: ${activity.name}`);
      }
    }

    return assignment;
  }

  private findSuitableRoom(activity: Activity): Room | undefined {
    let candidates: Room[] = [];

    if (activity.preferredRooms.length > 0) {
      candidates = this.rooms.filter(r => activity.preferredRooms.includes(r.id));
    }

    if (candidates.length === 0 && activity.subject.preferredRooms.length > 0) {
      candidates = this.rooms.filter(r => activity.subject.preferredRooms.includes(r.id));
    }

    if (candidates.length === 0) {
      candidates = [...this.rooms];
    }

    return this.shuffle(candidates)[0];
  }

  private canPlaceActivity(
    activity: Activity,
    period: Period,
    roomId: string,
    assignment: TimetableAssignment
  ): boolean {
    const totalMinutes = activity.totalDurationInMinutes;

    let currentMinute = period.minute;
    let currentHour = period.hour;
    let currentDay = period.day;

    for (let minutesElapsed = 0; minutesElapsed < totalMinutes; minutesElapsed++) {
      // Check if we've moved to the next hour
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;

        // Check if we've moved to the next day
        if (currentHour >= this.periodsPerDay) {
          currentHour = 0;
          currentDay++;

          // Check if we've exceeded available days
          if (currentDay >= this.daysCount) {
            return false;
          }
        }
      }

      // Check if there's an existing activity at this precise time slot
      const existingActivity = assignment.getActivityAtSlot({
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
      });

      if (existingActivity) {
        return false;
      }

      // Check if there's an existing activity in this room at this time
      const existingActivityInRoom = assignment.getActivityInRoomAtSlot(
        roomId,
        currentDay,
        currentHour,
        currentMinute
      );

      if (existingActivityInRoom) {
        return false;
      }

      currentMinute++;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
        if (currentHour >= this.periodsPerDay) {
          currentHour = 0;
          currentDay++;
          if (currentDay >= this.daysCount) {
            return false;
          }
        }
      }
    }

    const tempResult = assignment.assignActivity(activity, period, roomId);
    if (!tempResult) {
      return false;
    }

    let satisfiesHardConstraints = true;

    for (const constraint of this.timeConstraints) {
      console.log(constraint.type);
      if (constraint.weight === 100 && !constraint.isSatisfied(assignment)) {
        satisfiesHardConstraints = false;
        break;
      }
    }

    if (satisfiesHardConstraints) {
      for (const constraint of this.spaceConstraints) {
        if (constraint.weight === 100 && !constraint.isSatisfied(assignment)) {
          satisfiesHardConstraints = false;
          break;
        }
      }
    }

    assignment.removeActivity(activity);

    return satisfiesHardConstraints;
  }

  generateSchedule(maxIterations = 10000, initialTemperature = 100, coolingRate = 0.99): TimetableAssignment {
    let currentSolution = this.generateInitialSchedule();
    let currentScore = this.evaluateSchedule(currentSolution);
    let bestSolution = currentSolution;
    let bestScore = currentScore;

    console.log(`Initial schedule score: ${currentScore}`);

    let temperature = initialTemperature;
    let iteration = 0;

    while (iteration < maxIterations && temperature > 0.1) {
      const neighborSolution = this.generateNeighbor(currentSolution);
      const neighborScore = this.evaluateSchedule(neighborSolution);

      const acceptanceProbability = this.calculateAcceptanceProbability(
        currentScore,
        neighborScore,
        temperature
      );

      if (acceptanceProbability > this.random()) {
        currentSolution = neighborSolution;
        currentScore = neighborScore;

        if (currentScore > bestScore) {
          bestSolution = currentSolution;
          bestScore = currentScore;
          console.log(`New best score: ${bestScore} at iteration ${iteration}`);
        }
      }

      temperature *= coolingRate;
      iteration++;

      if (iteration % 100 === 0) {
        console.log(
          `Iteration ${iteration}, Temperature: ${temperature.toFixed(2)}, Score: ${currentScore.toFixed(2)}`
        );
      }
    }

    console.log(`Final best score: ${bestScore} after ${iteration} iterations`);
    return bestSolution;
  }

  private generateNeighbor(currentSolution: TimetableAssignment): TimetableAssignment {
    const neighbor = currentSolution.clone(); // Placeholder, should be a deep copy

    const modification = Math.floor(this.random() * 3);

    switch (modification) {
      case 0:
        this.moveRandomActivity(neighbor);
        break;
      case 1:
        this.swapRandomActivities(neighbor);
        break;
      case 2:
        this.changeRandomRoom(neighbor);
        break;
    }

    return neighbor;
  }

  private moveRandomActivity(solution: TimetableAssignment): void {
    // Implement moving a random activity to a different time slot
  }

  private swapRandomActivities(solution: TimetableAssignment): void {
    // Implement swapping two random activities
  }

  private changeRandomRoom(solution: TimetableAssignment): void {
    // Implement changing the room of a random activity
  }

  private calculateAcceptanceProbability(
    currentScore: number,
    newScore: number,
    temperature: number
  ): number {
    if (newScore > currentScore) {
      return 1.0;
    }

    const delta = currentScore - newScore;
    return Math.exp(-delta / temperature);
  }

  analyzeConstraintViolations(assignment: TimetableAssignment): Record<string, number> {
    const violations: Record<string, number> = {};

    for (const constraint of this.timeConstraints) {
      if (!constraint.isSatisfied(assignment)) {
        violations[constraint.type] = (violations[constraint.type] || 0) + 1;
      }
    }

    for (const constraint of this.spaceConstraints) {
      if (!constraint.isSatisfied(assignment)) {
        violations[constraint.type] = (violations[constraint.type] || 0) + 1;
      }
    }

    return violations;
  }

  exportSchedule(assignment: TimetableAssignment): ScheduleExport {
    return {
      teacherSchedules: this.exportTeacherSchedules(assignment),
      studentSetSchedules: this.exportStudentSetSchedules(assignment),
      roomSchedules: this.exportRoomSchedules(assignment),
    };
  }

  private exportTeacherSchedules(assignment: TimetableAssignment): Record<string, TeacherScheduleExport> {
    const result: Record<string, TeacherScheduleExport> = {};

    const teachers = new Map<string, Teacher>();
    for (const activity of this.activities) {
      for (const teacher of activity.teachers) {
        teachers.set(teacher.id, teacher);
      }
    }

    for (const [teacherId, teacher] of teachers) {
      const schedule: Record<string, ActivityScheduleItem[]> = {};

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day] = [];
      }

      const activities = assignment.getActivitiesForTeacher(teacherId);
      for (const activity of activities) {
        const slot = assignment.getSlotForActivity(activity.id);
        const roomId = assignment.getRoomForActivity(activity.id);

        if (slot && roomId) {
          const room = this.rooms.find(r => r.id === roomId);

          schedule[slot.day].push({
            ...this.generateActivityTimeSchedule(activity, slot, room),
            teachers: undefined,
          });
        }
      }

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => {
          const aTimeStamp = a.startTime.hour * 60 + a.startTime.minute;
          const bTimeStamp = b.startTime.hour * 60 + b.startTime.minute;
          return aTimeStamp - bTimeStamp;
        });
      }

      result[teacherId] = {
        teacherName: teacher.name,
        schedule,
      };
    }

    return result;
  }

  private exportStudentSetSchedules(
    assignment: TimetableAssignment
  ): Record<string, StudentSetScheduleExport> {
    const result: Record<string, StudentSetScheduleExport> = {};

    const studentSets = new Map<string, StudentSet>();
    for (const activity of this.activities) {
      for (const studentSet of activity.studentSets) {
        studentSets.set(studentSet.id, studentSet);
      }
    }

    for (const [studentSetId, studentSet] of studentSets) {
      const schedule: Record<string, ActivityScheduleItem[]> = {};

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day] = [];
      }

      const activities = assignment.getActivitiesForStudentSet(studentSetId);
      for (const activity of activities) {
        const slot = assignment.getSlotForActivity(activity.id);
        const roomId = assignment.getRoomForActivity(activity.id);

        if (slot && roomId) {
          const room = this.rooms.find(r => r.id === roomId);

          schedule[slot.day].push({
            ...this.generateActivityTimeSchedule(activity, slot, room),
            studentSets: undefined,
          });
        }
      }

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => {
          const aTimeStamp = a.startTime.hour * 60 + a.startTime.minute;
          const bTimeStamp = b.startTime.hour * 60 + b.startTime.minute;
          return aTimeStamp - bTimeStamp;
        });
      }

      result[studentSetId] = {
        studentSetName: studentSet.name,
        schedule,
      };
    }

    return result;
  }

  private exportRoomSchedules(assignment: TimetableAssignment): Record<string, RoomScheduleExport> {
    const result: Record<string, RoomScheduleExport> = {};

    for (const room of this.rooms) {
      const schedule: Record<string, ActivityScheduleItem[]> = {};

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day] = [];
      }

      const activities = assignment.getAllActivitiesInRoom(room.id);
      for (const activity of activities) {
        const slot = assignment.getSlotForActivity(activity.id);
        const roomId = assignment.getRoomForActivity(activity.id);

        if (slot && roomId) {
          const room = this.rooms.find(r => r.id === roomId);

          schedule[slot.day].push({
            ...this.generateActivityTimeSchedule(activity, slot, room),
            roomName: undefined,
          });
        }
      }

      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => {
          const aTimeStamp = a.startTime.hour * 60 + a.startTime.minute;
          const bTimeStamp = b.startTime.hour * 60 + b.startTime.minute;
          return aTimeStamp - bTimeStamp;
        });
      }

      result[room.id] = {
        roomName: room.name,
        building: room.building,
        capacity: room.capacity,
        schedule,
      };
    }

    return result;
  }

  private generateActivityTimeSchedule(
    activity: Pick<
      Activity,
      'id' | 'name' | 'subject' | 'totalDurationInMinutes' | 'teachers' | 'studentSets'
    >,

    slot: { hour: number; minute: number },
    room: { name: string } | undefined
  ): ActivityScheduleItem {
    const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
    return {
      activityId: activity.id,
      activityName: activity.name,
      subjectName: activity.subject.name,
      startTime: {
        hour: slot.hour,
        minute: slot.minute,
      },
      endTime: {
        hour: slot.hour + hours,
        minute: slot.minute + minutes,
      },
      roomName: room ? room.name : 'Unknown Room',
      teachers: activity.teachers.map(t => t.name),
      studentSets: activity.studentSets.map(s => s.name),
    };
  }
}

export { TimetableScheduler };
