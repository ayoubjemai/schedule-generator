"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderConsoleTimetable = renderConsoleTimetable;
function renderConsoleTimetable(assignment, daysCount, periodsPerDay) {
    console.log('Timetable:');
    for (let day = 0; day < daysCount; day++) {
        console.log(`Day ${day + 1}:`);
        for (let hour = 0; hour < periodsPerDay; hour++) {
            const activity = assignment.getActivityAtSlot(day, hour);
            if (activity) {
                const roomId = assignment.getRoomForActivity(activity.id);
                console.log(`  Hour ${hour}: ${activity.name} (Room: ${roomId})`);
            }
            else {
                console.log(`  Hour ${hour}: Free`);
            }
        }
        console.log(''); // Add a blank line between days
    }
}
//# sourceMappingURL=renderConsoleTimetable.js.map