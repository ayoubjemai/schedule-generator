interface Period {
  day: number;
  hour: number;
}
interface TimeConstraint {
  type: string;
  weight: number; 
  active: boolean;
  isSatisfied(assignment: TimetableAssignment): boolean;
}
interface SpaceConstraint {
  type: string;
  weight: number; 
  active: boolean;
  isSatisfied(assignment: TimetableAssignment): boolean;
}
class Teacher {
  id: string;
  name: string;
  notAvailablePeriods: Period[] = [];
  maxDaysPerWeek?: number;
  minDaysPerWeek?: number;
  maxGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number> = new Map();
  activityTagMaxHoursContinuously: Map<string, number> = new Map();
  activityTagMinHoursDaily: Map<string, number> = new Map();
  minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  minRestingHours?: number;
  homeRooms: string[] = [];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
class StudentSet {
  id: string;
  name: string;
  notAvailablePeriods: Period[] = [];
  maxDaysPerWeek?: number;
  maxEarlyBeginnings?: number;
  maxGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number> = new Map();
  activityTagMaxHoursContinuously: Map<string, number> = new Map();
  activityTagMinHoursDaily: Map<string, number> = new Map();
  minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  minRestingHours?: number;
  homeRooms: string[] = [];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
class Subject {
  id: string;
  name: string;
  preferredRooms: string[] = [];
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
class ActivityTag {
  id: string;
  name: string;
  preferredRooms: string[] = [];
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
class Room {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  notAvailablePeriods: Period[] = [];
  constructor(id: string, name: string, capacity: number, building?: string) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.building = building;
  }
}
class Activity {
  id: string;
  name: string;
  subject: Subject;
  teachers: Teacher[] = [];
  studentSets: StudentSet[] = [];
  totalDuration: number;
  activityTags: ActivityTag[] = [];
  preferredStartingTime?: Period;
  preferredStartingTimes: Period[] = [];
  preferredTimeSlots: Period[] = [];
  minDaysBetween?: number;
  maxDaysBetween?: number;
  endsStudentsDay: boolean = false;
  preferredRooms: string[] = [];
  subActivities: Activity[] = [];
  constructor(id: string, name: string, subject: Subject, totalDuration: number) {
    this.id = id;
    this.name = name;
    this.subject = subject;
    this.totalDuration = totalDuration;
  }
}
class TeacherNotAvailablePeriods implements TimeConstraint {
  type = 'TeacherNotAvailablePeriods';
  weight: number;
  active: boolean;
  teacher: Teacher;
  periods: Period[];
  constructor(teacher: Teacher, weight = 100, active = true) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.periods = [...teacher.notAvailablePeriods];
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    for (const activity of teacherActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;
      for (let i = 0; i < activity.totalDuration; i++) {
        const period: Period = {
          day: slot.day,
          hour: slot.hour + i,
        };
        if (this.periods.some(p => p.day === period.day && p.hour === period.hour)) {
          return false;
        }
      }
    }
    return true;
  }
}
class TeacherMaxDaysPerWeek implements TimeConstraint {
  type = 'TeacherMaxDaysPerWeek';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxDays: number;
  constructor(teacher: Teacher, maxDays: number, weight = 100, active = true) {
    this.teacher = teacher;
    this.maxDays = maxDays;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    const workingDays = new Set<number>();
    for (const activity of teacherActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (slot) {
        workingDays.add(slot.day);
      }
    }
    return workingDays.size <= this.maxDays;
  }
}
class RoomNotAvailable implements SpaceConstraint {
  type = 'RoomNotAvailable';
  weight: number;
  active: boolean;
  room: Room;
  periods: Period[];
  constructor(room: Room, weight = 100, active = true) {
    this.room = room;
    this.weight = weight;
    this.active = active;
    this.periods = [...room.notAvailablePeriods];
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const roomActivities = assignment.getActivitiesInRoom(this.room.id);
    for (const activity of roomActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;
      for (let i = 0; i < activity.totalDuration; i++) {
        const period: Period = {
          day: slot.day,
          hour: slot.hour + i,
        };
        if (this.periods.some(p => p.day === period.day && p.hour === period.hour)) {
          return false;
        }
      }
    }
    return true;
  }
}
class PreferredRoomsForActivity implements SpaceConstraint {
  type = 'PreferredRoomsForActivity';
  weight: number;
  active: boolean;
  activity: Activity;
  preferredRooms: string[];
  constructor(activity: Activity, preferredRooms: string[], weight = 100, active = true) {
    this.activity = activity;
    this.preferredRooms = preferredRooms.length > 0 ? preferredRooms : activity.preferredRooms;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.preferredRooms.length === 0) return true;
    const roomId = assignment.getRoomForActivity(this.activity.id);
    if (!roomId) return true; 
    return this.preferredRooms.includes(roomId);
  }
}
class TimetableAssignment {
  private activitySlots: Map<string, Period> = new Map();
  private activityRooms: Map<string, string> = new Map();
  private timeMatrix: Map<string, Activity> = new Map(); 
  private roomTimeMatrix: Map<string, Activity> = new Map(); 
  constructor(private daysCount: number, private periodsPerDay: number) {}
  assignActivity(activity: Activity, period: Period, roomId: string): boolean {
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}`;
      if (this.timeMatrix.has(slotKey)) {
        return false; 
      }
      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
      if (this.roomTimeMatrix.has(roomSlotKey)) {
        return false; 
      }
    }
    this.activitySlots.set(activity.id, period);
    this.activityRooms.set(activity.id, roomId);
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}`;
      this.timeMatrix.set(slotKey, activity);
      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
      this.roomTimeMatrix.set(roomSlotKey, activity);
    }
    return true;
  }
  removeActivity(activity: Activity): void {
    const period = this.activitySlots.get(activity.id);
    const roomId = this.activityRooms.get(activity.id);
    if (!period || !roomId) return;
    for (let i = 0; i < activity.totalDuration; i++) {
      const slotKey = `${period.day}_${period.hour + i}`;
      this.timeMatrix.delete(slotKey);
      const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
      this.roomTimeMatrix.delete(roomSlotKey);
    }
    this.activitySlots.delete(activity.id);
    this.activityRooms.delete(activity.id);
  }
  getSlotForActivity(activityId: string): Period | undefined {
    return this.activitySlots.get(activityId);
  }
  getRoomForActivity(activityId: string): string | undefined {
    return this.activityRooms.get(activityId);
  }
  getActivityAtSlot(day: number, hour: number): Activity | undefined {
    const slotKey = `${day}_${hour}`;
    return this.timeMatrix.get(slotKey);
  }
  getActivityInRoomAtSlot(roomId: string, day: number, hour: number): Activity | undefined {
    const roomSlotKey = `${roomId}_${day}_${hour}`;
    return this.roomTimeMatrix.get(roomSlotKey);
  }
  getActivitiesForTeacher(teacherId: string): Activity[] {
    const activities: Activity[] = [];
    for (const [activityId, _] of this.activitySlots) {
      const activity = this.getActivityById(activityId);
      if (activity && activity.teachers.some(t => t.id === teacherId)) {
        activities.push(activity);
      }
    }
    return activities;
  }
  getActivitiesForStudentSet(studentSetId: string): Activity[] {
    const activities: Activity[] = [];
    for (const [activityId, _] of this.activitySlots) {
      const activity = this.getActivityById(activityId);
      if (activity && activity.studentSets.some(s => s.id === studentSetId)) {
        activities.push(activity);
      }
    }
    return activities;
  }
  getActivitiesInRoom(roomId: string): Activity[] {
    const activities: Set<Activity> = new Set();
    for (const [key, activity] of this.roomTimeMatrix.entries()) {
      if (key.startsWith(`${roomId}_`)) {
        activities.add(activity);
      }
    }
    return Array.from(activities);
  }
  private getActivityById(activityId: string): Activity | undefined {
    for (const activity of this.timeMatrix.values()) {
      if (activity.id === activityId) {
        return activity;
      }
    }
    return undefined;
  }
  getWorkingDaysForTeacher(teacherId: string): Set<number> {
    const days = new Set<number>();
    const activities = this.getActivitiesForTeacher(teacherId);
    for (const activity of activities) {
      const slot = this.getSlotForActivity(activity.id);
      if (slot) {
        days.add(slot.day);
      }
    }
    return days;
  }
  getGapsForTeacherOnDay(teacherId: string, day: number): number {
    const activities = this.getActivitiesForTeacher(teacherId);
    const hoursWorking: number[] = [];
    for (const activity of activities) {
      const slot = this.getSlotForActivity(activity.id);
      if (slot && slot.day === day) {
        for (let i = 0; i < activity.totalDuration; i++) {
          hoursWorking.push(slot.hour + i);
        }
      }
    }
    if (hoursWorking.length <= 1) return 0; 
    hoursWorking.sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < hoursWorking.length; i++) {
      const hourGap = hoursWorking[i] - hoursWorking[i - 1] - 1;
      if (hourGap > 0) {
        gaps += hourGap;
      }
    }
    return gaps;
  }
  getSpanForTeacherOnDay(teacherId: string, day: number): number {
    const activities = this.getActivitiesForTeacher(teacherId);
    const hours: number[] = [];
    for (const activity of activities) {
      const slot = this.getSlotForActivity(activity.id);
      if (slot && slot.day === day) {
        hours.push(slot.hour);
        hours.push(slot.hour + activity.totalDuration - 1);
      }
    }
    if (hours.length === 0) return 0;
    const firstHour = Math.min(...hours);
    const lastHour = Math.max(...hours);
    return lastHour - firstHour + 1;
  }
  getWorkingDaysForStudentSet(studentSetId: string): Set<number> {
    const days = new Set<number>();
    const activities = this.getActivitiesForStudentSet(studentSetId);
    for (const activity of activities) {
      const slot = this.getSlotForActivity(activity.id);
      if (slot) {
        days.add(slot.day);
      }
    }
    return days;
  }
  getGapsForStudentSetOnDay(studentSetId: string, day: number): number {
    const activities = this.getActivitiesForStudentSet(studentSetId);
    const hoursWorking: number[] = [];
    for (const activity of activities) {
      const slot = this.getSlotForActivity(activity.id);
      if (slot && slot.day === day) {
        for (let i = 0; i < activity.totalDuration; i++) {
          hoursWorking.push(slot.hour + i);
        }
      }
    }
    if (hoursWorking.length <= 1) return 0;
    hoursWorking.sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < hoursWorking.length; i++) {
      const hourGap = hoursWorking[i] - hoursWorking[i - 1] - 1;
      if (hourGap > 0) {
        gaps += hourGap;
      }
    }
    return gaps;
  }
}
class TimetableScheduler {
  private activities: Activity[] = [];
  private timeConstraints: TimeConstraint[] = [];
  private spaceConstraints: SpaceConstraint[] = [];
  private rooms: Room[] = [];
  private daysCount: number;
  private periodsPerDay: number;
  private randomSeed: number;
  constructor(daysCount: number, periodsPerDay: number, randomSeed = 123456) {
    this.daysCount = daysCount;
    this.periodsPerDay = periodsPerDay;
    this.randomSeed = randomSeed;
  }
  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }
  addTimeConstraint(constraint: TimeConstraint): void {
    this.timeConstraints.push(constraint);
  }
  addSpaceConstraint(constraint: SpaceConstraint): void {
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
  private evaluateConstraint(
    constraint: TimeConstraint | SpaceConstraint,
    assignment: TimetableAssignment
  ): number {
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
        a.totalDuration +
        (a.preferredTimeSlots.length > 0 ? 1 : 0);
      const bConstraintLevel =
        b.teachers.length +
        b.studentSets.length +
        b.totalDuration +
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
          for (let hour = 0; hour <= this.periodsPerDay - activity.totalDuration; hour++) {
            possibleTimes.push({ day, hour });
          }
        }
        const shuffledTimes = this.shuffle(possibleTimes);
        for (const time of shuffledTimes) {
          const room = this.findSuitableRoom(activity);
          if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
            assignment.assignActivity(activity, time, room.id);
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
    for (let i = 0; i < activity.totalDuration; i++) {
      const hourToCheck = period.hour + i;
      if (hourToCheck >= this.periodsPerDay) {
        return false; 
      }
      const existingActivity = assignment.getActivityAtSlot(period.day, hourToCheck);
      if (existingActivity) {
        return false; 
      }
      const existingActivityInRoom = assignment.getActivityInRoomAtSlot(roomId, period.day, hourToCheck);
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
    const neighbor = currentSolution; 
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
  }
  private swapRandomActivities(solution: TimetableAssignment): void {
  }
  private changeRandomRoom(solution: TimetableAssignment): void {
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
            activityId: activity.id,
            activityName: activity.name,
            subjectName: activity.subject.name,
            startHour: slot.hour,
            endHour: slot.hour + activity.totalDuration - 1,
            roomName: room ? room.name : 'Unknown Room',
            studentSets: activity.studentSets.map(s => s.name),
          });
        }
      }
      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => a.startHour - b.startHour);
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
            activityId: activity.id,
            activityName: activity.name,
            subjectName: activity.subject.name,
            startHour: slot.hour,
            endHour: slot.hour + activity.totalDuration - 1,
            roomName: room ? room.name : 'Unknown Room',
            teachers: activity.teachers.map(t => t.name),
          });
        }
      }
      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => a.startHour - b.startHour);
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
      const activities = assignment.getActivitiesInRoom(room.id);
      for (const activity of activities) {
        const slot = assignment.getSlotForActivity(activity.id);
        if (slot) {
          schedule[slot.day].push({
            activityId: activity.id,
            activityName: activity.name,
            subjectName: activity.subject.name,
            startHour: slot.hour,
            endHour: slot.hour + activity.totalDuration - 1,
            teachers: activity.teachers.map(t => t.name),
            studentSets: activity.studentSets.map(s => s.name),
          });
        }
      }
      for (let day = 0; day < this.daysCount; day++) {
        schedule[day].sort((a, b) => a.startHour - b.startHour);
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
}
interface ActivityScheduleItem {
  activityId: string;
  activityName: string;
  subjectName: string;
  startHour: number;
  endHour: number;
  roomName?: string;
  teachers?: string[];
  studentSets?: string[];
}
interface TeacherScheduleExport {
  teacherName: string;
  schedule: Record<string, ActivityScheduleItem[]>;
}
interface StudentSetScheduleExport {
  studentSetName: string;
  schedule: Record<string, ActivityScheduleItem[]>;
}
interface RoomScheduleExport {
  roomName: string;
  building?: string;
  capacity: number;
  schedule: Record<string, ActivityScheduleItem[]>;
}
interface ScheduleExport {
  teacherSchedules: Record<string, TeacherScheduleExport>;
  studentSetSchedules: Record<string, StudentSetScheduleExport>;
  roomSchedules: Record<string, RoomScheduleExport>;
}
class StudentSetNotAvailablePeriods implements TimeConstraint {
  type = 'StudentSetNotAvailablePeriods';
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  periods: Period[];
  constructor(studentSet: StudentSet, weight = 100, active = true) {
    this.studentSet = studentSet;
    this.weight = weight;
    this.active = active;
    this.periods = [...studentSet.notAvailablePeriods];
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);
    for (const activity of studentSetActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;
      for (let i = 0; i < activity.totalDuration; i++) {
        const period: Period = {
          day: slot.day,
          hour: slot.hour + i,
        };
        if (this.periods.some(p => p.day === period.day && p.hour === period.hour)) {
          return false;
        }
      }
    }
    return true;
  }
}
class MaxConsecutiveHoursForTeacher implements TimeConstraint {
  type = 'MaxConsecutiveHoursForTeacher';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxHours: number;
  constructor(teacher: Teacher, maxHours: number, weight = 100, active = true) {
    this.teacher = teacher;
    this.maxHours = maxHours;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    for (let day = 0; day < 7; day++) {
      const hours: number[] = [];
      for (const activity of teacherActivities) {
        const slot = assignment.getSlotForActivity(activity.id);
        if (slot && slot.day === day) {
          for (let i = 0; i < activity.totalDuration; i++) {
            hours.push(slot.hour + i);
          }
        }
      }
      if (hours.length === 0) continue;
      hours.sort((a, b) => a - b);
      let currentSequence = 1;
      let maxSequence = 1;
      for (let i = 1; i < hours.length; i++) {
        if (hours[i] === hours[i - 1] + 1) {
          currentSequence++;
          maxSequence = Math.max(maxSequence, currentSequence);
        } else {
          currentSequence = 1;
        }
      }
      if (maxSequence > this.maxHours) {
        return false;
      }
    }
    return true;
  }
}
class PreferredStartingTimesForActivity implements TimeConstraint {
  type = 'PreferredStartingTimesForActivity';
  weight: number;
  active: boolean;
  activity: Activity;
  preferredTimes: Period[];
  constructor(activity: Activity, preferredTimes: Period[], weight = 50, active = true) {
    this.activity = activity;
    this.preferredTimes = preferredTimes.length > 0 ? preferredTimes : activity.preferredStartingTimes;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.preferredTimes.length === 0) return true;
    const slot = assignment.getSlotForActivity(this.activity.id);
    if (!slot) return true; 
    return this.preferredTimes.some(p => p.day === slot.day && p.hour === slot.hour);
  }
}
class ActivitiesNotOverlapping implements TimeConstraint {
  type = 'ActivitiesNotOverlapping';
  weight: number;
  active: boolean;
  activities: Activity[];
  constructor(activities: Activity[], weight = 100, active = true) {
    this.activities = activities;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.activities.length <= 1) return true;
    for (let i = 0; i < this.activities.length; i++) {
      const activityA = this.activities[i];
      const slotA = assignment.getSlotForActivity(activityA.id);
      if (!slotA) continue;
      for (let j = i + 1; j < this.activities.length; j++) {
        const activityB = this.activities[j];
        const slotB = assignment.getSlotForActivity(activityB.id);
        if (!slotB) continue;
        if (slotA.day === slotB.day) {
          const endA = slotA.hour + activityA.totalDuration - 1;
          const endB = slotB.hour + activityB.totalDuration - 1;
          if (
            (slotA.hour <= slotB.hour && endA >= slotB.hour) ||
            (slotB.hour <= slotA.hour && endB >= slotA.hour)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }
}
class MinGapsBetweenActivities implements TimeConstraint {
  type = 'MinGapsBetweenActivities';
  weight: number;
  active: boolean;
  activities: Activity[];
  minGaps: number;
  constructor(activities: Activity[], minGaps: number, weight = 100, active = true) {
    this.activities = activities;
    this.minGaps = minGaps;
    this.weight = weight;
    this.active = active;
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.activities.length <= 1) return true;
    for (let i = 0; i < this.activities.length; i++) {
      const activityA = this.activities[i];
      const slotA = assignment.getSlotForActivity(activityA.id);
      if (!slotA) continue;
      for (let j = i + 1; j < this.activities.length; j++) {
        const activityB = this.activities[j];
        const slotB = assignment.getSlotForActivity(activityB.id);
        if (!slotB) continue;
        if (slotA.day === slotB.day) {
          const endA = slotA.hour + activityA.totalDuration;
          const endB = slotB.hour + activityB.totalDuration;
          if (slotB.hour >= endA) {
            const gap = slotB.hour - endA;
            if (gap < this.minGaps) return false;
          } else if (slotA.hour >= endB) {
            const gap = slotA.hour - endB;
            if (gap < this.minGaps) return false;
          }
        }
      }
    }
    return true;
  }
}
function createSampleTimetable(): TimetableScheduler {
  const scheduler = new TimetableScheduler(5, 8); 
  const math = new Subject('MATH', 'Mathematics');
  const physics = new Subject('PHYS', 'Physics');
  const literature = new Subject('LIT', 'Literature');
  const room101 = new Room('R101', 'Room 101', 30, 'Main Building');
  const room102 = new Room('R102', 'Room 102', 30, 'Main Building');
  const lab201 = new Room('L201', 'Lab 201', 25, 'Science Wing');
  scheduler.addRoom(room101);
  scheduler.addRoom(room102);
  scheduler.addRoom(lab201);
  physics.preferredRooms.push(lab201.id);
  const lectureTags = new ActivityTag('LECT', 'Lecture');
  const labTag = new ActivityTag('LAB', 'Laboratory');
  const teacher1 = new Teacher('T1', 'John Smith');
  const teacher2 = new Teacher('T2', 'Mary Johnson');
  teacher1.notAvailablePeriods.push({ day: 4, hour: 0 }); 
  teacher1.maxHoursDaily = 6;
  teacher1.maxHoursContinuously = 3;
  teacher1.maxDaysPerWeek = 4;
  teacher2.notAvailablePeriods.push({ day: 0, hour: 7 }); 
  const class9A = new StudentSet('9A', 'Class 9A');
  const class9B = new StudentSet('9B', 'Class 9B');
  class9A.maxHoursDaily = 7;
  class9A.maxHoursContinuously = 4;
  class9B.maxHoursDaily = 7;
  class9B.maxHoursContinuously = 4;
  const mathLecture9A = new Activity('ML9A', 'Math Lecture 9A', math, 2);
  mathLecture9A.teachers.push(teacher1);
  mathLecture9A.studentSets.push(class9A);
  mathLecture9A.activityTags.push(lectureTags);
  mathLecture9A.preferredStartingTimes.push({ day: 0, hour: 0 }); 
  const mathLecture9B = new Activity('ML9B', 'Math Lecture 9B', math, 2);
  mathLecture9B.teachers.push(teacher1);
  mathLecture9B.studentSets.push(class9B);
  mathLecture9B.activityTags.push(lectureTags);
  const physicsLecture9A = new Activity('PL9A', 'Physics Lecture 9A', physics, 2);
  physicsLecture9A.teachers.push(teacher2);
  physicsLecture9A.studentSets.push(class9A);
  physicsLecture9A.activityTags.push(lectureTags);
  const physicsLab9A = new Activity('PLAB9A', 'Physics Lab 9A', physics, 2);
  physicsLab9A.teachers.push(teacher2);
  physicsLab9A.studentSets.push(class9A);
  physicsLab9A.activityTags.push(labTag);
  physicsLab9A.preferredRooms.push(lab201.id);
  const litLecture9A = new Activity('LL9A', 'Literature Lecture 9A', literature, 2);
  litLecture9A.teachers.push(teacher2);
  litLecture9A.studentSets.push(class9A);
  litLecture9A.activityTags.push(lectureTags);
  scheduler.addActivity(mathLecture9A);
  scheduler.addActivity(mathLecture9B);
  scheduler.addActivity(physicsLecture9A);
  scheduler.addActivity(physicsLab9A);
  scheduler.addActivity(litLecture9A);
  scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher1));
  scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.maxDaysPerWeek!));
  scheduler.addTimeConstraint(new MaxConsecutiveHoursForTeacher(teacher1, teacher1.maxHoursContinuously!));
  scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher2));
  scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class9A));
  scheduler.addTimeConstraint(new MinGapsBetweenActivities([physicsLecture9A, physicsLab9A], 1));
  scheduler.addSpaceConstraint(new PreferredRoomsForActivity(physicsLab9A, [lab201.id]));
  scheduler.addTimeConstraint(
    new ActivitiesNotOverlapping([mathLecture9A, mathLecture9B, physicsLecture9A, physicsLab9A, litLecture9A])
  );
  scheduler.addTimeConstraint(
    new PreferredStartingTimesForActivity(mathLecture9A, mathLecture9A.preferredStartingTimes)
  );
  scheduler.addSpaceConstraint(new RoomNotAvailable(lab201));
  return scheduler;
}
function main() {
  console.log('Creating timetable scheduler...');
  const scheduler = createSampleTimetable();
  console.log('Generating timetable...');
  const timetable = scheduler.generateSchedule(10000, 100, 0.995);
  console.log('Analyzing constraint violations...');
  const violations = scheduler.analyzeConstraintViolations(timetable);
  console.log('Constraint violations:', violations);
  console.log('Exporting schedule...');
  const scheduleExport = scheduler.exportSchedule(timetable);
  console.log('Schedule exported successfully.');
  console.log(JSON.stringify(scheduleExport, null, 2));
}
/**
 * Renders a simple text-based timetable for console viewing
 */
function renderConsoleTimetable(
  scheduleExport: ScheduleExport,
  daysCount: number,
  periodsPerDay: number
): void {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  console.log('\n=== TEACHER SCHEDULES ===');
  for (const teacherId in scheduleExport.teacherSchedules) {
    const teacherSchedule = scheduleExport.teacherSchedules[teacherId];
    console.log(`\n${teacherSchedule.teacherName}'s Schedule:`);
    for (let day = 0; day < daysCount; day++) {
      if (teacherSchedule.schedule[day].length > 0) {
        console.log(`  ${dayNames[day]}:`);
        for (const item of teacherSchedule.schedule[day]) {
          console.log(
            `    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${item.activityName}) in ${
              item.roomName
            }`
          );
        }
      }
    }
  }
  console.log('\n=== STUDENT SET SCHEDULES ===');
  for (const studentSetId in scheduleExport.studentSetSchedules) {
    const studentSetSchedule = scheduleExport.studentSetSchedules[studentSetId];
    console.log(`\n${studentSetSchedule.studentSetName}'s Schedule:`);
    for (let day = 0; day < daysCount; day++) {
      if (studentSetSchedule.schedule[day].length > 0) {
        console.log(`  ${dayNames[day]}:`);
        for (const item of studentSetSchedule.schedule[day]) {
          console.log(
            `    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${
              item.activityName
            }) with ${item.teachers?.join(', ')} in ${item.roomName}`
          );
        }
      }
    }
  }
  console.log('\n=== ROOM SCHEDULES ===');
  for (const roomId in scheduleExport.roomSchedules) {
    const roomSchedule = scheduleExport.roomSchedules[roomId];
    console.log(`\n${roomSchedule.roomName} (${roomSchedule.building || 'No Building'}):`);
    for (let day = 0; day < daysCount; day++) {
      if (roomSchedule.schedule[day].length > 0) {
        console.log(`  ${dayNames[day]}:`);
        for (const item of roomSchedule.schedule[day]) {
          console.log(
            `    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${
              item.activityName
            }) with ${item.teachers?.join(', ')}`
          );
        }
      }
    }
  }
}
export {
  Period,
  TimeConstraint,
  SpaceConstraint,
  Teacher,
  StudentSet,
  Subject,
  ActivityTag,
  Room,
  Activity,
  TeacherNotAvailablePeriods,
  TeacherMaxDaysPerWeek,
  StudentSetNotAvailablePeriods,
  MaxConsecutiveHoursForTeacher,
  PreferredStartingTimesForActivity,
  ActivitiesNotOverlapping,
  MinGapsBetweenActivities,
  RoomNotAvailable,
  PreferredRoomsForActivity,
  TimetableAssignment,
  TimetableScheduler,
  ActivityScheduleItem,
  TeacherScheduleExport,
  StudentSetScheduleExport,
  RoomScheduleExport,
  ScheduleExport,
  renderConsoleTimetable,
};
