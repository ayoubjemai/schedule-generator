"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableAssignment = void 0;
class TimetableAssignment {
    constructor(daysCount, periodsPerDay) {
        this.daysCount = daysCount;
        this.periodsPerDay = periodsPerDay;
        this.activitySlots = new Map(); // activityId -> Period
        this.activityRooms = new Map(); // activityId -> roomId
        this.timeMatrix = new Map(); // dayHour -> Activity mapping
        this.roomTimeMatrix = new Map(); // roomDayHour -> Activity mapping
    }
    assignActivity(activity, period, roomId) {
        // Check if the slot is available
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            if (this.timeMatrix.has(slotKey)) {
                return false; // Time slot already occupied
            }
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            if (this.roomTimeMatrix.has(roomSlotKey)) {
                return false; // Room already occupied at this time
            }
        }
        // Assign the activity
        this.activitySlots.set(activity.id, period);
        this.activityRooms.set(activity.id, roomId);
        // Update the matrices
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            this.timeMatrix.set(slotKey, activity);
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            this.roomTimeMatrix.set(roomSlotKey, activity);
        }
        return true;
    }
    removeActivity(activity) {
        const period = this.activitySlots.get(activity.id);
        const roomId = this.activityRooms.get(activity.id);
        if (!period || !roomId)
            return;
        // Remove from matrices
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            this.timeMatrix.delete(slotKey);
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            this.roomTimeMatrix.delete(roomSlotKey);
        }
        // Remove from maps
        this.activitySlots.delete(activity.id);
        this.activityRooms.delete(activity.id);
    }
    getSlotForActivity(activityId) {
        return this.activitySlots.get(activityId);
    }
    getRoomForActivity(activityId) {
        return this.activityRooms.get(activityId);
    }
    getActivityAtSlot(day, hour) {
        const slotKey = `${day}_${hour}`;
        return this.timeMatrix.get(slotKey);
    }
    getActivityInRoomAtSlot(roomId, day, hour) {
        const roomSlotKey = `${roomId}_${day}_${hour}`;
        return this.roomTimeMatrix.get(roomSlotKey);
    }
    getActivitiesForTeacher(teacherId) {
        const activities = [];
        // For each assigned activity, check if the teacher is involved
        for (const [activityId, _] of this.activitySlots) {
            const activity = this.getActivityById(activityId);
            if (activity && activity.teachers.some(t => t.id === teacherId)) {
                activities.push(activity);
            }
        }
        return activities;
    }
    getActivitiesForStudentSet(studentSetId) {
        const activities = [];
        // For each assigned activity, check if the student set is involved
        for (const [activityId, _] of this.activitySlots) {
            const activity = this.getActivityById(activityId);
            if (activity && activity.studentSets.some(s => s.id === studentSetId)) {
                activities.push(activity);
            }
        }
        return activities;
    }
    getAllActivityAssignments() {
        return Array.from(this.activitySlots.keys()).map(activityId => this.getActivityById(activityId));
    }
    getActivitiesInRoom(roomId) {
        const activities = new Set();
        // Collect all activities assigned to this room
        for (const [key, activity] of this.roomTimeMatrix.entries()) {
            if (key.startsWith(`${roomId}_`)) {
                activities.add(activity);
            }
        }
        return Array.from(activities);
    }
    getActivityById(activityId) {
        // This would require an activity repository in a real implementation
        // For now, we'll assume we can extract the activity from the matrices
        for (const activity of this.timeMatrix.values()) {
            if (activity.id === activityId) {
                return activity;
            }
        }
        return undefined;
    }
}
exports.TimetableAssignment = TimetableAssignment;
//# sourceMappingURL=TimetableAssignment.js.map