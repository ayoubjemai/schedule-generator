import { Room } from '../../models/Room';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../utils/helper';

export class RoomNotAvailable implements Constraint {
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

    // Check all activities assigned to this room
    const roomActivities = assignment.getAllActivitiesInRoom(this.room.id);

    for (const activity of roomActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;

      const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
      // Check if any period of this activity conflicts with not available periods
      for (let i = 0; i < hours; i++) {
        for (let j = 0; j < minutes; j++) {
          const period: Period = {
            day: slot.day,
            hour: slot.hour + i,
            minute: slot.minute + j,
          };

          if (
            this.periods.some(
              p => p.day === period.day && p.hour === period.hour && p.minute === period.minute
            )
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }
}
