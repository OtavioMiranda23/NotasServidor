"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLastCursor = void 0;
class UpdateLastCursor {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(qiveCursor, zohoCursor, config) {
        const zohoCursorInt = Number(zohoCursor);
        if (!qiveCursor || qiveCursor <= zohoCursorInt) {
            qiveCursor = zohoCursorInt;
        }
        const content = {
            data: {
                ultimo_cursor: qiveCursor,
            },
        };
        const savedRecords = await this.zoho.saveRecord(content, config);
        return { cursorUpdated: true, lastCursor: savedRecords };
    }
}
exports.UpdateLastCursor = UpdateLastCursor;
