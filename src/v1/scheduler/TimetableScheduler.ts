import { Activity } from '../models/Activity';
import { Room } from '../models/Room';
import { StudentSet } from '../models/StudentSet';
import { Teacher } from '../models/Teacher';
import { Constraint } from '../types/constraints';
import {
  ActivityScheduleItem,
  Period,
  RoomScheduleExport,
  ScheduleExport,
  StudentSetScheduleExport,
  TeacherScheduleExport,
} from '../types/core';
import { convertMinutesToHoursAndMinutes } from '../utils/convertMinutesToHoursAndMinutes';
import { TimetableAssignment } from './TimetableAssignment';
class TimetableScheduler {
  private activities: Activity[] = [];
  private timeConstraints: Constraint[] = [];
  private spaceConstraints: Constraint[] = [];
  private rooms: Room[] = [];
  private possibleTimes: Period[] = [];
  constructor(private daysCount: number, private periodsPerDay: number, private randomSeed = 123456) {
    for (let day = 0; day < this.daysCount; day++) {
      for (let hour = 0; hour <= this.periodsPerDay; hour++) {
        for (let min = 0; min < 60; min++) {
          this.possibleTimes.push({ day, hour, minute: min });
        }
      }
    }
  }
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
        const shuffledPeriod = this.shuffle(this.possibleTimes);
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
    const currentMinute = period.minute;
    const currentHour = period.hour;
    let currentDay = period.day;
    for (let minutesElapsed = 0; minutesElapsed < totalMinutes; minutesElapsed++) {
      const { hours, minutes } = convertMinutesToHoursAndMinutes(minutesElapsed);
      const existingActivity = assignment.getActivityAtSlot({
        day: currentDay,
        hour: currentHour + hours,
        minute: currentMinute + minutes,
      });
      if (existingActivity) {
        return false;
      }
      const existingActivityInRoom = assignment.getActivityInRoomAtSlot(
        roomId,
        currentDay,
        currentHour + hours,
        currentMinute + minutes
      );
      if (existingActivityInRoom) {
        return false;
      }
    }
    const tempResult = assignment.assignActivity(activity, period, roomId);
    if (!tempResult) {
      return false;
    }
    let satisfiesHardConstraints = true;
    for (const constraint of this.timeConstraints) {
      const activitiesConstraints = constraint.activities;
      const activitiesConstraintIds = activitiesConstraints.map(a => a.id);
      const isConstraintBelongToActivity = activitiesConstraintIds.includes(activity.id);
      if (constraint.weight === 100 && !constraint.isSatisfied(assignment) && isConstraintBelongToActivity) {
        satisfiesHardConstraints = false;
        break;
      }
    }
    if (satisfiesHardConstraints) {
      for (const constraint of this.spaceConstraints) {
        const activitiesConstraints = constraint.activities;
        const activitiesConstraintIds = activitiesConstraints.map(a => a.id);
        const isConstraintBelongToActivity = activitiesConstraintIds.includes(activity.id);
        if (
          constraint.weight === 100 &&
          !constraint.isSatisfied(assignment) &&
          isConstraintBelongToActivity
        ) {
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
      if (currentScore === 100) {
        break;
      }
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
    const neighbor = currentSolution.clone();
    const modification = Math.floor(this.random() * 3);
    switch (modification) {
      case 0:
        this.swapRandomActivities(neighbor);
        break;
      case 1:
        this.changeRandomRoom(neighbor);
        break;
      case 2:
        this.moveRandomActivity(neighbor);
        break;
    }
    return neighbor;
  }
  private moveRandomActivity(solution: TimetableAssignment): void {
    const allActivities = solution.getAllActivityAssignments();
    if (allActivities.length === 0) return;
    const randomIndex = Math.floor(this.random() * allActivities.length);
    const activity = allActivities[randomIndex];
    const currentSlot = solution.getSlotForActivity(activity.id);
    const currentRoomId = solution.getRoomForActivity(activity.id);
    if (!currentSlot || !currentRoomId) return;
    solution.removeActivity(activity);
    const shuffledPeriods = this.shuffle(this.possibleTimes);
    let placed = false;
    for (const period of shuffledPeriods) {
      if (this.canPlaceActivity(activity, period, currentRoomId, solution)) {
        solution.assignActivity(activity, period, currentRoomId);
        placed = true;
        break;
      }
      if (!placed) {
        const otherRooms = this.rooms.filter(r => r.id !== currentRoomId);
        const shuffledRooms = this.shuffle(otherRooms);
        for (const room of shuffledRooms) {
          if (this.canPlaceActivity(activity, period, room.id, solution)) {
            solution.assignActivity(activity, period, room.id);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
    if (!placed) {
      solution.assignActivity(activity, currentSlot, currentRoomId);
    }
  }
  private swapRandomActivities(solution: TimetableAssignment): void {
    const allActivities = solution.getAllActivityAssignments();
    if (allActivities.length < 2) return; 
    const indexA = Math.floor(this.random() * allActivities.length);
    let indexB = Math.floor(this.random() * (allActivities.length - 1));
    if (indexB >= indexA) indexB++; 
    const activityA = allActivities[indexA];
    const activityB = allActivities[indexB];
    const slotA = solution.getSlotForActivity(activityA.id);
    const roomA = solution.getRoomForActivity(activityA.id);
    const slotB = solution.getSlotForActivity(activityB.id);
    const roomB = solution.getRoomForActivity(activityB.id);
    if (!slotA || !slotB || !roomA || !roomB) return;
    solution.removeActivity(activityA);
    solution.removeActivity(activityB);
    const canPlaceAInB = this.canPlaceActivity(activityA, slotB, roomB, solution);
    const canPlaceBInA = this.canPlaceActivity(activityB, slotA, roomA, solution);
    if (canPlaceAInB && canPlaceBInA) {
      solution.assignActivity(activityA, slotB, roomB);
      solution.assignActivity(activityB, slotA, roomA);
    } else {
      solution.assignActivity(activityA, slotA, roomA);
      solution.assignActivity(activityB, slotB, roomB);
    }
  }
  private changeRandomRoom(solution: TimetableAssignment): void {
    const allActivities = solution.getAllActivityAssignments();
    if (allActivities.length === 0) return;
    const randomIndex = Math.floor(this.random() * allActivities.length);
    const activity = allActivities[randomIndex];
    const currentSlot = solution.getSlotForActivity(activity.id);
    const currentRoomId = solution.getRoomForActivity(activity.id);
    if (!currentSlot || !currentRoomId) return;
    const otherRooms = this.rooms.filter(room => room.id !== currentRoomId);
    if (otherRooms.length === 0) return; 
    let suitableRooms = otherRooms;
    if (activity.preferredRooms.length > 0) {
      const preferredRooms = otherRooms.filter(room => activity.preferredRooms.includes(room.id));
      if (preferredRooms.length > 0) {
        suitableRooms = preferredRooms;
      }
    }
    const shuffledRooms = this.shuffle(suitableRooms);
    solution.removeActivity(activity);
    let placed = false;
    for (const room of shuffledRooms) {
      if (this.canPlaceActivity(activity, currentSlot, room.id, solution)) {
        solution.assignActivity(activity, currentSlot, room.id);
        placed = true;
        break;
      }
    }
    if (!placed) {
      solution.assignActivity(activity, currentSlot, currentRoomId);
    }
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
