"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastCursor = void 0;
class GetLastCursor {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(reportName) {
        const allCursors = await this.zoho.findAllItems(reportName);
        if (!allCursors.success) {
            return null;
        }
        if (allCursors.data.length === 0) {
            return null;
        }
        const first = allCursors.data[0];
        return first.ultimo_cursor;
    }
}
exports.GetLastCursor = GetLastCursor;
