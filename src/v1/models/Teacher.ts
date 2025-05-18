import { Period } from '../types/core';
import { ValidationError } from '../utils/ValidationError';
import { Model } from './model';

type ID = string;

interface ITeacher {
  id: ID;
  name: string;
  notAvailablePeriods?: Period[];
  maxDaysPerWeek?: number;
  minDaysPerWeek?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  minHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily?: Map<string, number>;
  activityTagMaxHoursContinuously?: Map<string, number>;
  activityTagMinHoursContinuously?: Map<string, number>;
  activityTagMinHoursDaily?: Map<string, number>;
  minGapsBetweenActivityTags?: Map<[string, string], number>;
  maxDaysPerWeekForHourlyInterval?: Map<[number, number], number>;
  minRestingHours?: number;
  homeRooms?: ID[];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
  minHoursDailyByActivityTag?: Map<string, number>;
  minHoursDailyActivityTagPerMinutes: Map<`${string}_${string}`, number>;
}

export class Teacher extends Model {
  id: ID;
  name: string;
  notAvailablePeriods: Period[] = [];
  maxDaysPerWeek?: number;
  minDaysPerWeek?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  minHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number> = new Map();
  activityTagMaxHoursContinuously: Map<string, number> = new Map();
  activityTagMinHoursContinuously: Map<string, number> = new Map();
  minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  activityTagMinHoursDaily: Map<string, number> = new Map();
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  minRestingHours?: number;
  homeRooms: ID[] = [];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
  minHoursDailyActivityTagPerMinutes: Map<`${string}_${string}`, number> = new Map();

  constructor(
    id: ID,
    name: string,
    payload?: Partial<{
      notAvailablePeriods: Period[];
      maxDaysPerWeek: number;
      minDaysPerWeek: number;
      maxGapsPerDay: number;
      minGapsPerDay: number;
      maxGapsPerWeek: number;
      maxHoursDaily: number;
      minHoursDaily: number;
      minHoursDailyActivityTagPerMinutes: Map<`${string}_${string}`, number>;
      maxHoursContinuously: number;
      minHoursContinuously: number;
      maxSpanPerDay: number;
      minRestingHours: number;
      maxRoomChangesPerDay: number;
      maxRoomChangesPerWeek: number;
      maxBuildingChangesPerDay: number;
      maxBuildingChangesPerWeek: number;
      minGapsBetweenRoomChanges: number;
      minGapsBetweenBuildingChanges: number;
      activityTagMaxHoursDaily: Map<string, number>;
      activityTagMaxHoursContinuously: Map<string, number>;
      activityTagMinHoursContinuously: Map<string, number>;
      activityTagMinHoursDaily: Map<string, number>;
      minGapsBetweenActivityTags: Map<[string, string], number>;
      maxDaysPerWeekForHourlyInterval: Map<[number, number], number>;
      homeRooms: string[];
    }>
  ) {
    super(id, name);
    this.id = id;
    this.name = name;
    if (!payload) return;

    try {
      // Assign values from payload
      this.notAvailablePeriods = payload.notAvailablePeriods || [];
      this.maxDaysPerWeek = payload.maxDaysPerWeek;
      this.minDaysPerWeek = payload.minDaysPerWeek;
      this.maxGapsPerDay = payload.maxGapsPerDay;
      this.minGapsPerDay = payload.minGapsPerDay;
      this.maxGapsPerWeek = payload.maxGapsPerWeek;
      this.maxHoursDaily = payload.maxHoursDaily;
      this.maxHoursContinuously = payload.maxHoursContinuously;
      this.minHoursContinuously = payload.minHoursContinuously;
      this.maxSpanPerDay = payload.maxSpanPerDay;
      this.minHoursDaily = payload.minHoursDaily;
      this.minRestingHours = payload.minRestingHours;
      this.maxRoomChangesPerDay = payload.maxRoomChangesPerDay;
      this.maxRoomChangesPerWeek = payload.maxRoomChangesPerWeek;
      this.maxBuildingChangesPerDay = payload.maxBuildingChangesPerDay;
      this.maxBuildingChangesPerWeek = payload.maxBuildingChangesPerWeek;
      this.minGapsBetweenRoomChanges = payload.minGapsBetweenRoomChanges;
      this.minGapsBetweenBuildingChanges = payload.minGapsBetweenBuildingChanges;

      if (payload.activityTagMaxHoursDaily) this.activityTagMaxHoursDaily = payload.activityTagMaxHoursDaily;

      if (payload.activityTagMaxHoursContinuously)
        this.activityTagMaxHoursContinuously = payload.activityTagMaxHoursContinuously;

      if (payload.activityTagMinHoursContinuously)
        this.activityTagMinHoursContinuously = payload.activityTagMinHoursContinuously;

      if (payload.activityTagMinHoursDaily) this.activityTagMinHoursDaily = payload.activityTagMinHoursDaily;

      if (payload.maxDaysPerWeekForHourlyInterval)
        this.maxDaysPerWeekForHourlyInterval = payload.maxDaysPerWeekForHourlyInterval;
      if (payload.minGapsBetweenActivityTags)
        this.minGapsBetweenActivityTags = payload.minGapsBetweenActivityTags;

      if (payload.homeRooms) this.homeRooms = payload.homeRooms;

      this.minHoursDailyActivityTagPerMinutes = payload.minHoursDailyActivityTagPerMinutes || new Map();

      // Validate all constraints
      this.validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error instanceof Error) {
        throw new Error(`Error initializing teacher ${name}: ${error.message}`);
      }
    }
  }

  /**
   * Validates all constraints to ensure they are consistent
   * @throws ValidationError if constraints are inconsistent
   */
  protected validate(): void {
    this.validateMinMaxRelationships();
    this.validateDaysConstraints();
    this.validateHoursConstraints();
    this.validateGapsConstraints();
    this.validateActivityTagConstraints();
    this.validateRoomBuildingConstraints();
  }

  /**
   * Validates min/max relationships
   */
  private validateMinMaxRelationships(): void {
    if (
      this.minDaysPerWeek !== undefined &&
      this.maxDaysPerWeek !== undefined &&
      this.minDaysPerWeek > this.maxDaysPerWeek
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: minDaysPerWeek (${this.minDaysPerWeek}) cannot be greater than maxDaysPerWeek (${this.maxDaysPerWeek})`
      );
    }

    // Gaps per day
    if (
      this.minGapsPerDay !== undefined &&
      this.maxGapsPerDay !== undefined &&
      this.minGapsPerDay > this.maxGapsPerDay
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: minGapsPerDay (${this.minGapsPerDay}) cannot be greater than maxGapsPerDay (${this.maxGapsPerDay})`
      );
    }

    // Hours daily
    if (
      this.minHoursDaily !== undefined &&
      this.maxHoursDaily !== undefined &&
      this.minHoursDaily > this.maxHoursDaily
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: minHoursDaily (${this.minHoursDaily}) cannot be greater than maxHoursDaily (${this.maxHoursDaily})`
      );
    }

    // Hours continuously
    if (
      this.minHoursContinuously !== undefined &&
      this.maxHoursContinuously !== undefined &&
      this.minHoursContinuously > this.maxHoursContinuously
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: minHoursContinuously (${this.minHoursContinuously}) cannot be greater than maxHoursContinuously (${this.maxHoursContinuously})`
      );
    }

    if (
      this.maxHoursContinuously !== undefined &&
      this.maxHoursDaily != undefined &&
      this.maxHoursContinuously > this.maxHoursDaily
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: maxHoursContinuously (${this.maxHoursContinuously}) cannot be greater than maxHoursDaily (${this.maxHoursDaily})`
      );
    }

    if (
      this.minHoursContinuously != undefined &&
      this.minHoursDaily != undefined &&
      this.minHoursContinuously > this.minHoursDaily
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: minHoursContinuously (${this.minHoursContinuously}) cannot be greater than minHoursDaily (${this.minHoursDaily})`
      );
    }

    if (this.minGapsPerDay) {
      for (const [activityTag, minGap] of this.minHoursDailyActivityTagPerMinutes.entries()) {
        const activityTag1 = activityTag.split('_')[0];
        const activityTag2 = activityTag.split('_')[1];
        if (minGap < this.minGapsPerDay) {
          throw new ValidationError(
            `Teacher ${this.name}: minGapsBetweenActivityTags (${minGap}) of ${activityTag1} and ${activityTag2} cannot be less than minGapsPerDay (${this.minGapsPerDay})`
          );
        }
      }
    }
  }

  /**
   * Validates day-related constraints
   */
  private validateDaysConstraints(): void {
    // Days per week should be between 1-7
    if (this.maxDaysPerWeek !== undefined && (this.maxDaysPerWeek < 1 || this.maxDaysPerWeek > 7)) {
      throw new ValidationError(
        `Teacher ${this.name}: maxDaysPerWeek (${this.maxDaysPerWeek}) must be between 1 and 7`
      );
    }

    if (this.minDaysPerWeek !== undefined && (this.minDaysPerWeek < 1 || this.minDaysPerWeek > 7)) {
      throw new ValidationError(
        `Teacher ${this.name}: minDaysPerWeek (${this.minDaysPerWeek}) must be between 1 and 7`
      );
    }

    // Validate maxDaysPerWeekForHourlyInterval
    this.maxDaysPerWeekForHourlyInterval.forEach((days, interval) => {
      if (days < 0 || days > 7) {
        throw new ValidationError(
          `Teacher ${this.name}: Days per week for hourly interval must be between 0 and 7`
        );
      }

      const [start, end] = interval;
      if (start < 0 || start > 23 || end < 0 || end > 23 || start > end) {
        throw new ValidationError(`Teacher ${this.name}: Invalid hourly interval [${start}, ${end}]`);
      }
    });
  }

  /**
   * Validates hour-related constraints
   */
  private validateHoursConstraints(): void {
    // Reasonable limits for hours
    if (this.maxHoursDaily !== undefined && (this.maxHoursDaily < 0 || this.maxHoursDaily > 24)) {
      throw new ValidationError(
        `Teacher ${this.name}: maxHoursDaily (${this.maxHoursDaily}) must be between 0 and 24`
      );
    }

    // Span per day should be reasonable
    if (this.maxSpanPerDay !== undefined && (this.maxSpanPerDay < 0 || this.maxSpanPerDay > 24)) {
      throw new ValidationError(
        `Teacher ${this.name}: maxSpanPerDay (${this.maxSpanPerDay}) must be between 0 and 24`
      );
    }

    // Rest hours should be reasonable
    if (this.minRestingHours !== undefined && (this.minRestingHours < 0 || this.minRestingHours > 24)) {
      throw new ValidationError(
        `Teacher ${this.name}: minRestingHours (${this.minRestingHours}) must be between 0 and 24`
      );
    }

    // Max hours continuously should not exceed max hours daily
    if (
      this.maxHoursContinuously !== undefined &&
      this.maxHoursDaily !== undefined &&
      this.maxHoursContinuously > this.maxHoursDaily
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: maxHoursContinuously (${this.maxHoursContinuously}) cannot exceed maxHoursDaily (${this.maxHoursDaily})`
      );
    }
  }

  /**
   * Validates gap-related constraints
   */
  private validateGapsConstraints(): void {
    // Gaps should be non-negative
    if (this.maxGapsPerDay !== undefined && this.maxGapsPerDay < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxGapsPerDay (${this.maxGapsPerDay}) must be non-negative`
      );
    }

    if (this.minGapsPerDay !== undefined && this.minGapsPerDay < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: minGapsPerDay (${this.minGapsPerDay}) must be non-negative`
      );
    }

    if (this.maxGapsPerWeek !== undefined && this.maxGapsPerWeek < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxGapsPerWeek (${this.maxGapsPerWeek}) must be non-negative`
      );
    }

    // Max gaps per week should be at least maxGapsPerDay
    if (
      this.maxGapsPerDay !== undefined &&
      this.maxGapsPerWeek !== undefined &&
      this.maxGapsPerWeek < this.maxGapsPerDay
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: maxGapsPerWeek (${this.maxGapsPerWeek}) should be at least maxGapsPerDay (${this.maxGapsPerDay})`
      );
    }
  }

  /**
   * Validates activity tag-related constraints
   */
  private validateActivityTagConstraints(): void {
    // For each activity tag, validate min/max relationships
    for (const [tag, minHours] of this.activityTagMinHoursDaily.entries()) {
      const maxHours = this.activityTagMaxHoursDaily.get(tag);
      if (maxHours !== undefined && minHours > maxHours) {
        throw new ValidationError(
          `Teacher ${this.name}: For activity tag "${tag}", minHoursDaily (${minHours}) cannot exceed maxHoursDaily (${maxHours})`
        );
      }

      // Also check against global maxHoursDaily
      if (this.maxHoursDaily !== undefined && minHours > this.maxHoursDaily) {
        throw new ValidationError(
          `Teacher ${this.name}: For activity tag "${tag}", minHoursDaily (${minHours}) cannot exceed teacher's maxHoursDaily (${this.maxHoursDaily})`
        );
      }
    }

    // Check max continuously constraints
    for (const [tag, maxHours] of this.activityTagMaxHoursContinuously.entries()) {
      const maxDailyForTag = this.activityTagMaxHoursDaily.get(tag);
      if (maxDailyForTag !== undefined && maxHours > maxDailyForTag) {
        throw new ValidationError(
          `Teacher ${this.name}: For activity tag "${tag}", maxHoursContinuously (${maxHours}) cannot exceed maxHoursDaily (${maxDailyForTag}) for the same tag`
        );
      }
    }
  }

  /**
   * Validates room and building-related constraints
   */
  private validateRoomBuildingConstraints(): void {
    // Room changes should be non-negative
    if (this.maxRoomChangesPerDay !== undefined && this.maxRoomChangesPerDay < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxRoomChangesPerDay (${this.maxRoomChangesPerDay}) must be non-negative`
      );
    }

    if (this.maxRoomChangesPerWeek !== undefined && this.maxRoomChangesPerWeek < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxRoomChangesPerWeek (${this.maxRoomChangesPerWeek}) must be non-negative`
      );
    }

    // Building changes should be non-negative
    if (this.maxBuildingChangesPerDay !== undefined && this.maxBuildingChangesPerDay < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxBuildingChangesPerDay (${this.maxBuildingChangesPerDay}) must be non-negative`
      );
    }

    if (this.maxBuildingChangesPerWeek !== undefined && this.maxBuildingChangesPerWeek < 0) {
      throw new ValidationError(
        `Teacher ${this.name}: maxBuildingChangesPerWeek (${this.maxBuildingChangesPerWeek}) must be non-negative`
      );
    }

    // Weekly changes should be at least the daily maximum
    if (
      this.maxRoomChangesPerDay !== undefined &&
      this.maxRoomChangesPerWeek !== undefined &&
      this.maxRoomChangesPerWeek < this.maxRoomChangesPerDay
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: maxRoomChangesPerWeek (${this.maxRoomChangesPerWeek}) should be at least maxRoomChangesPerDay (${this.maxRoomChangesPerDay})`
      );
    }

    if (
      this.maxBuildingChangesPerDay !== undefined &&
      this.maxBuildingChangesPerWeek !== undefined &&
      this.maxBuildingChangesPerWeek < this.maxBuildingChangesPerDay
    ) {
      throw new ValidationError(
        `Teacher ${this.name}: maxBuildingChangesPerWeek (${this.maxBuildingChangesPerWeek}) should be at least maxBuildingChangesPerDay (${this.maxBuildingChangesPerDay})`
      );
    }
  }

  // Get methods remain the same
  get<T extends keyof ITeacher>(fieldName: T): ITeacher[T] {
    //@ts-ignore
    return this[fieldName];
  }
}
