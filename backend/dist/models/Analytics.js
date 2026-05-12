"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModel = void 0;
// Minimal, type-safe stubs to unblock TypeScript compilation.
// Replace with correct Analytics schema/model logic later.
exports.AnalyticsModel = {
    getDashboardStats: async (_params = {}) => {
        return {
            totalSessions: 0,
            totalEvents: 0,
            uniqueUsers: 0,
            topPages: [],
            topEvents: [],
            deviceStats: [],
            browserStats: []
        };
    },
    getUserActivity: async (_userId, _params = {}) => {
        return { sessions: [], events: [] };
    },
    trackPageView: async () => { },
    trackEvent: async () => { }
};
//# sourceMappingURL=Analytics.js.map