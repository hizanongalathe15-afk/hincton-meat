"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const database_1 = require("../database");
const connectDB = async () => {
    try {
        // Test database connection
        await database_1.prisma.$connect();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await database_1.prisma.$disconnect();
        console.log('Database disconnected');
    }
    catch (error) {
        console.error('Error disconnecting from database:', error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map