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
import { IntervalTree, TimetableAssignment } from './TimetableAssignment';

class TimetableScheduler {
  private activities: Activity[] = [];
  private timeConstraints: Constraint[] = [];
  private spaceConstraints: Constraint[] = [];
  private rooms: Room[] = [];
  private possibleTimes: Period[] = [];

  constructor(
    private daysCount: number,
    private periodsPerDay: number,
    private randomSeed = 123456,
    minuteIncrement: number = 1
  ) {
    for (let day = 0; day < this.daysCount; day++) {
      for (let hour = 0; hour <= this.periodsPerDay; hour++) {
        for (let min = 0; min < 60; min += minuteIncrement) {
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

  private getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
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
    assignment.assignActivity(activity, period, roomId);

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

      //if (acceptanceProbability > this.random()) {
      currentSolution = neighborSolution;
      currentScore = neighborScore;

      if (currentScore > bestScore) {
        bestSolution = currentSolution;
        bestScore = currentScore;
        console.log(`New best score: ${bestScore} at iteration ${iteration}`);
      }
      // }

      if (bestScore === 100) {
        break;
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

    const originalCount = neighbor.getAllActivityAssignments().length;

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
      // case 3:
      //   this.shuffleAllActivities(neighbor);
      //   break;
      default:
        throw new Error('Invalid modification type');
    }

    const newCount = neighbor.getAllActivityAssignments().length;
    if (newCount !== originalCount) {
      throw new Error(
        `Activity count changed from ${originalCount} to ${newCount} during neighbor generation`
      );
    }

    return neighbor;
  }

  private shuffleAllActivities(solution: TimetableAssignment): void {
    // Get all activities currently in the solution
    const allActivities = solution.getAllActivityAssignments();

    if (allActivities.length <= 1) return; // Need at least 2 activities to shuffle

    // Store original positions before shuffling
    const originalPositions: Record<string, { slot: Period; roomId: string }> = {};

    // Capture original positions
    for (const activity of allActivities) {
      const slot = solution.getSlotForActivity(activity.id);
      const roomId = solution.getRoomForActivity(activity.id);

      if (slot && roomId) {
        originalPositions[activity.id] = { slot, roomId };
      }
    }

    // Remove all activities from the solution
    for (const activity of allActivities) {
      solution.removeActivity(activity);
    }

    // Shuffle the activities to randomize placement order
    const shuffledActivities = this.shuffle([...allActivities]);

    // Keep track of which activities were successfully placed
    const successfullyPlaced: Set<string> = new Set();

    // Try to place each activity in a new position
    for (const activity of shuffledActivities) {
      // Get random periods and rooms to try
      const shuffledPeriods = this.shuffle(this.possibleTimes);
      let placed = false;

      // Prioritize activity's preferred rooms if available
      let preferredRooms: Room[] = [];
      if (activity.preferredRooms.length > 0) {
        preferredRooms = this.rooms.filter(r => activity.preferredRooms.includes(r.id));
      }

      // If no preferred rooms, use all rooms
      const roomsToTry =
        preferredRooms.length > 0
          ? [...preferredRooms, ...this.rooms.filter(r => !preferredRooms.map(pr => pr.id).includes(r.id))]
          : this.rooms;

      // Shuffle the rooms for random selection
      const shuffledRooms = this.shuffle(roomsToTry);

      // Try each period and room combination
      for (const period of shuffledPeriods) {
        if (placed) break;

        for (const room of shuffledRooms) {
          if (this.canPlaceActivity(activity, period, room.id, solution)) {
            solution.assignActivity(activity, period, room.id);
            successfullyPlaced.add(activity.id);
            placed = true;
            break;
          }
        }
      }

      // If couldn't place in a new position, revert to original position
      if (!placed) {
        const original = originalPositions[activity.id];
        if (original) {
          // Try to place back in original position
          if (this.canPlaceActivity(activity, original.slot, original.roomId, solution)) {
            solution.assignActivity(activity, original.slot, original.roomId);
            successfullyPlaced.add(activity.id);
          } else {
            console.warn(`Could not place activity ${activity.id} back in its original position`);
            // As a last resort, try any possible position
            const lastAttemptPlaced = this.findAnyValidPosition(activity, solution);
            if (lastAttemptPlaced) {
              successfullyPlaced.add(activity.id);
            }
          }
        }
      }
    }

    // Check if any activities couldn't be placed and try to re-add them
    for (const activity of allActivities) {
      if (!successfullyPlaced.has(activity.id)) {
        const original = originalPositions[activity.id];
        if (original) {
          // Try to place back in original position
          if (this.canPlaceActivity(activity, original.slot, original.roomId, solution)) {
            solution.assignActivity(activity, original.slot, original.roomId);
          } else {
            // As a last resort, try any possible position
            this.findAnyValidPosition(activity, solution);
          }
        }
      }
    }
  }

  // Helper method to find any valid position for an activity
  private findAnyValidPosition(activity: Activity, solution: TimetableAssignment): boolean {
    const shuffledPeriods = this.shuffle(this.possibleTimes);
    const shuffledRooms = this.shuffle(this.rooms);

    for (const period of shuffledPeriods) {
      for (const room of shuffledRooms) {
        if (this.canPlaceActivity(activity, period, room.id, solution)) {
          solution.assignActivity(activity, period, room.id);
          return true;
        }
      }
    }

    // If we get here, we couldn't place the activity anywhere
    console.warn(`Could not find any valid position for activity ${activity.id}: ${activity.name}`);
    return false;
  }

  private moveRandomActivity(solution: TimetableAssignment): void {
    // Get all activities currently in the solution
    const allActivities = solution.getAllActivityAssignments();

    if (allActivities.length === 0) return;

    // Pick a random activity
    const activity = this.getRandomElement(allActivities)!;

    // Get current slot and room
    const currentSlot = solution.getSlotForActivity(activity.id);
    const currentRoomId = solution.getRoomForActivity(activity.id);

    if (!currentSlot || !currentRoomId) return;

    // Remove activity from current position
    solution.removeActivity(activity);

    // Shuffle possible periods to try
    const shuffledPeriods = this.shuffle(this.possibleTimes);
    // Try to place activity in a new position

    let placed = false;
    for (const period of shuffledPeriods) {
      // Try current room first, then others if necessary
      if (this.canPlaceActivity(activity, period, currentRoomId, solution)) {
        solution.assignActivity(activity, period, currentRoomId);
        placed = true;
        break;
      }

      // If can't place in current room, try others
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

    // If we couldn't place the activity anywhere else, put it back
    if (!placed) {
      solution.assignActivity(activity, currentSlot, currentRoomId);
    }
  }

  private swapRandomActivities(solution: TimetableAssignment): void {
    // Get all activities currently in the solution
    const allActivities = solution.getAllActivityAssignments();
    if (allActivities.length < 2) {
      console.log('no activities to swap');
      return;
    } // Need at least two activities to swap

    // Pick two different random activities
    const indexA = Math.floor(this.random() * allActivities.length);
    let indexB = Math.floor(this.random() * (allActivities.length - 1));
    if (indexB >= indexA) indexB++; // Ensure we don't pick the same activity twice

    const activityA = allActivities[indexA];
    const activityB = allActivities[indexB];

    // Get current slots and rooms
    const slotA = solution.getSlotForActivity(activityA.id);
    const roomA = solution.getRoomForActivity(activityA.id);
    const slotB = solution.getSlotForActivity(activityB.id);
    const roomB = solution.getRoomForActivity(activityB.id);

    if (!slotA || !slotB || !roomA || !roomB) return;

    // Remove both activities from their current positions
    solution.removeActivity(activityA);
    solution.removeActivity(activityB);

    // Check if we can place activity A in slot B with room B
    const canPlaceAInB = this.canPlaceActivity(activityA, slotB, roomB, solution);

    // Check if we can place activity B in slot A with room A
    const canPlaceBInA = this.canPlaceActivity(activityB, slotA, roomA, solution);

    // If both placements are valid, perform the swap
    if (canPlaceAInB && canPlaceBInA) {
      solution.assignActivity(activityA, slotB, roomB);
      solution.assignActivity(activityB, slotA, roomA);
    } else {
      // Otherwise, put activities back in their original positions
      solution.assignActivity(activityA, slotA, roomA);
      solution.assignActivity(activityB, slotB, roomB);
    }
  }

  private changeRandomRoom(solution: TimetableAssignment): void {
    // Get all activities currently in the solution
    const allActivities = solution.getAllActivityAssignments();
    if (allActivities.length === 0) {
      console.log('no activities to change room');
      return;
    }

    // Pick a random activity
    const randomIndex = Math.floor(this.random() * allActivities.length);
    const activity = allActivities[randomIndex];

    // Get current slot and room
    const currentSlot = solution.getSlotForActivity(activity.id);
    const currentRoomId = solution.getRoomForActivity(activity.id);

    if (!currentSlot || !currentRoomId) return;

    // Get other rooms different from the current one
    const otherRooms = this.rooms.filter(room => room.id !== currentRoomId);
    if (otherRooms.length === 0) return; // No other rooms available

    // Determine suitable rooms based on activity preferences
    let suitableRooms = otherRooms;

    // If activity has preferred rooms, prioritize those
    if (activity.preferredRooms.length > 0) {
      const preferredRooms = otherRooms.filter(room => activity.preferredRooms.includes(room.id));

      if (preferredRooms.length > 0) {
        suitableRooms = preferredRooms;
      }
    }

    // Shuffle rooms for random selection
    const shuffledRooms = this.shuffle(suitableRooms);

    // Remove activity from current position
    solution.removeActivity(activity);

    // Try to place activity in a different room
    let placed = false;

    for (const room of shuffledRooms) {
      if (this.canPlaceActivity(activity, currentSlot, room.id, solution)) {
        solution.assignActivity(activity, currentSlot, room.id);
        placed = true;
        break;
      }
    }

    // If we couldn't place the activity in a different room, put it back
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
