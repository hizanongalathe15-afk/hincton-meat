"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerUiSetup = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Hincton Meat Products API',
        version: '1.0.0',
        description: 'API documentation for Hincton Meat Products backend',
    },
    servers: [
        {
            url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{ bearerAuth: [] }],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: swaggerDefinition,
    apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
});
exports.swaggerSpec = swaggerSpec;
exports.swaggerUiSetup = swagger_ui_express_1.default.serve;
//# sourceMappingURL=swaggerSetup.js.map