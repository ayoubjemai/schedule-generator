import { Period } from '../types/core';

type ID = string;

interface IStudnetSet {
  id: ID;
  name: string;
  notAvailablePeriods: Period[];
  maxDaysPerWeek?: number;
  maxEarlyBeginnings?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number>;
  activityTagMaxHoursContinuously: Map<string, number>;
  activityTagMinHoursDaily: Map<string, number>;
  minGapsBetweenActivityTags: Map<[string, string], number>;
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number>;
  minRestingHours?: number;
  homeRooms: string[];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
}

export class StudentSet {
  id: string;
  name: string;
  protected notAvailablePeriods: Period[] = [];
  protected maxDaysPerWeek?: number;
  protected maxEarlyBeginnings?: number;
  protected maxGapsPerDay?: number;
  protected minGapsPerDay?: number;
  protected maxGapsPerWeek?: number;
  protected maxHoursDaily?: number;
  protected maxHoursContinuously?: number;
  protected maxSpanPerDay?: number;
  protected minHoursDaily?: number;
  protected activityTagMaxHoursDaily: Map<string, number> = new Map();
  protected activityTagMaxHoursContinuously: Map<string, number> = new Map();
  protected activityTagMinHoursDaily: Map<string, number> = new Map();
  protected minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  protected maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  protected minRestingHours?: number;
  protected homeRooms: string[] = [];
  protected maxRoomChangesPerDay?: number;
  protected maxRoomChangesPerWeek?: number;
  protected maxBuildingChangesPerDay?: number;
  protected maxBuildingChangesPerWeek?: number;
  protected minGapsBetweenRoomChanges?: number;
  protected minGapsBetweenBuildingChanges?: number;

  constructor(id: string, data: Partial<Omit<IStudnetSet, 'name'>> & { name: string }) {
    this.id = id;
    const {
      name,
      notAvailablePeriods,
      maxDaysPerWeek,
      maxEarlyBeginnings,
      maxGapsPerDay,
      minGapsPerDay,
      maxGapsPerWeek,
      maxHoursDaily,
      maxHoursContinuously,
      maxSpanPerDay,
      minHoursDaily,
      activityTagMaxHoursDaily,
      activityTagMaxHoursContinuously,
      activityTagMinHoursDaily,
      minGapsBetweenActivityTags,
      maxDaysPerWeekForHourlyInterval,
      minRestingHours,
      homeRooms,
      maxRoomChangesPerDay,
      maxRoomChangesPerWeek,
      maxBuildingChangesPerDay,
      maxBuildingChangesPerWeek,
      minGapsBetweenRoomChanges,
      minGapsBetweenBuildingChanges,
    } = data;
    this.name = name;
    notAvailablePeriods && (this.notAvailablePeriods = notAvailablePeriods);
    this.maxDaysPerWeek = maxDaysPerWeek;
    this.maxEarlyBeginnings = maxEarlyBeginnings;
    this.maxGapsPerDay = maxGapsPerDay;
    this.minGapsPerDay = minGapsPerDay;
    this.maxGapsPerWeek = maxGapsPerWeek;
    this.maxHoursDaily = maxHoursDaily;
    this.maxHoursContinuously = maxHoursContinuously;
    this.maxSpanPerDay = maxSpanPerDay;
    this.minHoursDaily = minHoursDaily;
    activityTagMaxHoursDaily && (this.activityTagMaxHoursDaily = activityTagMaxHoursDaily);
    activityTagMaxHoursContinuously &&
      (this.activityTagMaxHoursContinuously = activityTagMaxHoursContinuously);
    activityTagMinHoursDaily && (this.activityTagMinHoursDaily = activityTagMinHoursDaily);
    minGapsBetweenActivityTags && (this.minGapsBetweenActivityTags = minGapsBetweenActivityTags);
    maxDaysPerWeekForHourlyInterval &&
      (this.maxDaysPerWeekForHourlyInterval = maxDaysPerWeekForHourlyInterval);
    this.minRestingHours = minRestingHours;
    homeRooms && (this.homeRooms = homeRooms);
    this.maxRoomChangesPerDay = maxRoomChangesPerDay;
    this.maxRoomChangesPerWeek = maxRoomChangesPerWeek;
    this.maxBuildingChangesPerDay = maxBuildingChangesPerDay;
    this.maxBuildingChangesPerWeek = maxBuildingChangesPerWeek;
    this.minGapsBetweenRoomChanges = minGapsBetweenRoomChanges;
    this.minGapsBetweenBuildingChanges = minGapsBetweenBuildingChanges;
  }

  get<T extends keyof IStudnetSet>(fieldName: T): IStudnetSet[T] {
    //@ts-ignore
    return this[fieldName];
  }

  set<T extends keyof IStudnetSet>(fieldName: T, value: IStudnetSet[T]): void {
    //@ts-ignore
    this[fieldName] = value;
  }
}
