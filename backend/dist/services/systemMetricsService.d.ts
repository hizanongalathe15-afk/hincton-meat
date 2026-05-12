export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
        model: string;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    storage: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    network: {
        download: number;
        upload: number;
        latency: number;
    };
    uptime: number;
    loadAverage: number[];
    timestamp: string;
}
export interface SystemWakeTime {
    bootTime: Date;
    uptime: string;
    lastRestart: Date;
    totalUptime: string;
    currentTime: Date;
    timezone: string;
}
declare class SystemMetricsService {
    private networkStats;
    getCpuUsage(): Promise<number>;
    getMemoryUsage(): Promise<{
        total: number;
        used: number;
        free: number;
        usage: number;
    }>;
    getStorageUsage(): Promise<{
        total: number;
        used: number;
        free: number;
        usage: number;
    }>;
    getNetworkStats(): Promise<{
        download: number;
        upload: number;
        latency: number;
    }>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getSystemWakeTime(): SystemWakeTime;
    private parseSize;
}
export declare const systemMetricsService: SystemMetricsService;
export {};
//# sourceMappingURL=systemMetricsService.d.ts.map