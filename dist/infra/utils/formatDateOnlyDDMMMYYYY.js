"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = formatDateOnlyDDMMMYYYY;
function formatDateOnlyDDMMMYYYY(input) {
    const date = new Date(input);
    const dateInUTC3 = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    const day = String(dateInUTC3.getUTCDate()).padStart(2, "0");
    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const month = monthNames[dateInUTC3.getUTCMonth()];
    const year = dateInUTC3.getUTCFullYear();
    return `${day}-${month}-${year}`;
}
