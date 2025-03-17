"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferredRoomsForActivity = void 0;
class PreferredRoomsForActivity {
    constructor(activity, preferredRooms, weight = 100, active = true) {
        this.type = 'PreferredRoomsForActivity';
        this.activity = activity;
        this.preferredRooms = preferredRooms.length > 0 ? preferredRooms : activity.preferredRooms;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.preferredRooms.length === 0)
            return true;
        const roomId = assignment.getRoomForActivity(this.activity.id);
        if (!roomId)
            return true; // Not yet assigned a room
        return this.preferredRooms.includes(roomId);
    }
}
exports.PreferredRoomsForActivity = PreferredRoomsForActivity;
//# sourceMappingURL=PreferredRoomsForActivity.js.map