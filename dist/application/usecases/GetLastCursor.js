"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastCursor = void 0;
class GetLastCursor {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(linksNames) {
        const allCursors = await this.zoho.findAllItems(linksNames);
        if (!allCursors.success || allCursors.data.length === 0) {
            return null;
        }
        allCursors.data.sort((a, b) => {
            if (a.Added_Time && b.Added_Time) {
                return (new Date(b.Added_Time).getTime() - new Date(a.Added_Time).getTime());
            }
            return 0;
        });
        const first = allCursors.data[0];
        return first.ultimo_cursor;
    }
}
exports.GetLastCursor = GetLastCursor;
