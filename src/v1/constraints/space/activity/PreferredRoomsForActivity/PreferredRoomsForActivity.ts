import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

export class PreferredRoomsForActivity implements Constraint {
  type = ConstraintType.space.activity.PreferredRoomsForActivity;
  weight: number;
  active: boolean;
  activity: Activity;
  preferredRooms: string[];
  activities: Activity[] = [];

  constructor(activity: Activity, preferredRooms: string[], weight = DEFAULT_WEIGHT * 0.5, active = true) {
    this.activity = activity;
    this.preferredRooms = preferredRooms.length > 0 ? preferredRooms : activity.preferredRooms;
    this.weight = weight;
    this.active = active;
    this.addActivity(activity);
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active || this.preferredRooms.length === 0) return true;

    const roomId = assignment.getRoomForActivity(this.activity.id);
    if (!roomId) return true; // Not yet assigned a room

    return this.preferredRooms.includes(roomId);
  }
}
