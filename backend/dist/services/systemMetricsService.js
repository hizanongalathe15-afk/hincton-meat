"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemMetricsService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SystemMetricsService {
    constructor() {
        this.networkStats = { rx: 0, tx: 0, timestamp: Date.now() };
    }
    async getCpuUsage() {
        try {
            const sample = () => {
                const cpus = os_1.default.cpus();
                let totalIdle = 0;
                let totalTick = 0;
                cpus.forEach(cpu => {
                    for (const type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });
                return { idle: totalIdle, total: totalTick };
            };
            const start = sample();
            await new Promise(resolve => setTimeout(resolve, 150));
            const end = sample();
            const idle = end.idle - start.idle;
            const total = end.total - start.total;
            if (total <= 0)
                return 0;
            return Math.round((100 - (idle / total) * 100) * 100) / 100;
        }
        catch (error) {
            console.error('Error getting CPU usage:', error);
            return 0;
        }
    }
    async getMemoryUsage() {
        const total = os_1.default.totalmem();
        const free = os_1.default.freemem();
        const used = total - free;
        const usage = (used / total) * 100;
        return {
            total: Math.round(total / 1024 / 1024), // MB
            used: Math.round(used / 1024 / 1024), // MB
            free: Math.round(free / 1024 / 1024), // MB
            usage: Math.round(usage * 100) / 100
        };
    }
    async getStorageUsage() {
        try {
            if (typeof fs_1.default.statfsSync === 'function') {
                const stats = fs_1.default.statfsSync(process.cwd());
                const total = Number(stats.blocks) * Number(stats.bsize);
                const free = Number(stats.bfree) * Number(stats.bsize);
                const used = total - free;
                const usage = total > 0 ? (used / total) * 100 : 0;
                return { total, used, free, usage: Math.round(usage * 100) / 100 };
            }
            const { stdout } = await execAsync("df -B1 . | tail -1 | awk '{print $2,$3,$4}'");
            const [total, used, free] = stdout.trim().split(/\s+/).map(Number);
            const usage = total > 0 ? (used / total) * 100 : 0;
            return { total: total || 0, used: used || 0, free: free || 0, usage: Math.round(usage * 100) / 100 };
        }
        catch (error) {
            console.error('Error getting storage usage:', error);
            return { total: 0, used: 0, free: 0, usage: 0 };
        }
    }
    async getNetworkStats() {
        try {
            const platform = os_1.default.platform();
            let currentRx = 0;
            let currentTx = 0;
            if (platform === 'linux') {
                const contents = fs_1.default.readFileSync('/proc/net/dev', 'utf8');
                contents.split('\n').slice(2).forEach((line) => {
                    const [rawName, rawStats] = line.split(':');
                    const name = rawName?.trim();
                    if (!name || name === 'lo' || !rawStats)
                        return;
                    const stats = rawStats.trim().split(/\s+/).map(Number);
                    currentRx += stats[0] || 0;
                    currentTx += stats[8] || 0;
                });
            }
            else {
                // Fallback - use basic network stats (limited on non-Linux platforms)
                const interfaces = os_1.default.networkInterfaces();
                for (const name of Object.keys(interfaces)) {
                    const iface = interfaces[name];
                    if (iface && !iface[0].internal) {
                        // NetworkInterfaceInfo doesn't have rx/tx properties on all platforms
                        // We'll use a basic estimation for non-Linux systems
                        currentRx += 0;
                        currentTx += 0;
                    }
                }
            }
            const now = Date.now();
            const timeDiff = (now - this.networkStats.timestamp) / 1000; // seconds
            let download = 0;
            let upload = 0;
            if (timeDiff > 0 && this.networkStats.timestamp > 0) {
                const rxDiff = currentRx - this.networkStats.rx;
                const txDiff = currentTx - this.networkStats.tx;
                download = Math.round((rxDiff / timeDiff / 1024) * 100) / 100; // KB/s
                upload = Math.round((txDiff / timeDiff / 1024) * 100) / 100; // KB/s
            }
            this.networkStats = { rx: currentRx, tx: currentTx, timestamp: now };
            // Test latency with ping
            let latency = 0;
            try {
                const { stdout } = await execAsync("ping -c 1 8.8.8.8 | grep 'time=' | cut -d'=' -f4 | cut -d' ' -f1");
                latency = parseFloat(stdout.trim()) || 0;
            }
            catch (error) {
                latency = 0;
            }
            return { download, upload, latency };
        }
        catch (error) {
            console.error('Error getting network stats:', error);
            return { download: 0, upload: 0, latency: 0 };
        }
    }
    async getSystemMetrics() {
        const [cpuUsage, memory, storage, network] = await Promise.all([
            this.getCpuUsage(),
            this.getMemoryUsage(),
            this.getStorageUsage(),
            this.getNetworkStats()
        ]);
        return {
            cpu: {
                usage: cpuUsage,
                cores: os_1.default.cpus().length,
                model: os_1.default.cpus()[0]?.model || 'Unknown'
            },
            memory,
            storage,
            network,
            uptime: os_1.default.uptime(),
            loadAverage: os_1.default.loadavg(),
            timestamp: new Date().toISOString()
        };
    }
    getSystemWakeTime() {
        const uptime = os_1.default.uptime();
        const bootTime = new Date(Date.now() - uptime * 1000);
        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m`;
            }
            else if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            else {
                return `${minutes}m`;
            }
        };
        return {
            bootTime,
            uptime: formatUptime(uptime),
            lastRestart: bootTime,
            totalUptime: formatUptime(uptime),
            currentTime: new Date(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        };
    }
    parseSize(sizeStr) {
        const units = {
            'K': 1 / 1024,
            'M': 1,
            'G': 1024,
            'T': 1024 * 1024
        };
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/);
        if (!match)
            return 0;
        const [, num, unit] = match;
        const value = parseFloat(num);
        return unit ? value * (units[unit] || 1) : value;
    }
}
exports.systemMetricsService = new SystemMetricsService();
//# sourceMappingURL=systemMetricsService.js.map