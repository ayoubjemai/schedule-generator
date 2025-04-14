import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

export class RoomNotAvailable implements Constraint {
  type = ConstraintType.space.room.RoomNotAvailable;
  activities: Activity[] = [];
  weight: number;
  active: boolean;
  room: Room;
  periods: Period[];

  constructor(room: Room, weight = DEFAULT_WEIGHT, active = true) {
    this.room = room;
    this.weight = weight;
    this.active = active;
    this.periods = [...room.notAvailablePeriods];
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const roomActivities = assignment.getAllActivitiesInRoom(this.room.id);

    for (const activity of roomActivities) {
      this.addActivity(activity);
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;

      const startActivityInMinutes = ActivityHelper.getStartTimeInMinutes({ slot });
      const endActivityInMinutes = ActivityHelper.getEndTimeInMinutes({ slot, activity });
      const periodInMinuts = this.periods.map(p => ActivityHelper.getStartTimeInMinutes({ slot: p }));

      const isNotAvailable = periodInMinuts.some(period => {
        return period >= startActivityInMinutes && period <= endActivityInMinutes;
      });
      if (isNotAvailable) return false;
    }

    return true;
  }
}
