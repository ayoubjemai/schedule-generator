"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomNotAvailable = void 0;
class RoomNotAvailable {
    constructor(room, weight = 100, active = true) {
        this.type = 'RoomNotAvailable';
        this.room = room;
        this.weight = weight;
        this.active = active;
        this.periods = [...room.notAvailablePeriods];
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        // Check all activities assigned to this room
        const roomActivities = assignment.getActivitiesInRoom(this.room.id);
        for (const activity of roomActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (!slot)
                continue;
            // Check if any period of this activity conflicts with not available periods
            for (let i = 0; i < activity.totalDuration; i++) {
                const period = {
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
exports.RoomNotAvailable = RoomNotAvailable;
//# sourceMappingURL=RoomNotAvailable.js.map