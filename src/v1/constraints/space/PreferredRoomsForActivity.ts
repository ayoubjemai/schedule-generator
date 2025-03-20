import { Activity } from '../../models/Activity';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';

export class PreferredRoomsForActivity implements Constraint {
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
    if (!roomId) return true; // Not yet assigned a room

    return this.preferredRooms.includes(roomId);
  }
}
