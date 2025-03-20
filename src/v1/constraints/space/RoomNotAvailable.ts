import { Period, SpaceConstraint } from '../../models/interfaces';
import { Room } from '../../models/Room';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';

export class RoomNotAvailable implements SpaceConstraint {
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
    const roomActivities = assignment.getActivitiesInRoom(this.room.id);

    for (const activity of roomActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;

      // Check if any period of this activity conflicts with not available periods
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
