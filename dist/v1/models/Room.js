"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(id, name, capacity, building) {
        this.notAvailablePeriods = [];
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.building = building;
    }
}
exports.Room = Room;
//# sourceMappingURL=Room.js.map