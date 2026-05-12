export declare const AnalyticsModel: {
    getDashboardStats: (_params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<any>;
    getUserActivity: (_userId: string, _params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<any>;
    trackPageView: () => Promise<void>;
    trackEvent: () => Promise<void>;
};
//# sourceMappingURL=Analytics.d.ts.map