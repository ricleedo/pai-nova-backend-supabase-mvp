"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./config/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const seniors_routes_1 = __importDefault(require("./modules/seniors/seniors.routes"));
const reminders_routes_1 = __importDefault(require("./modules/reminders/reminders.routes"));
const scheduler_service_1 = __importDefault(require("./services/scheduler.service"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'PAI Care & SerenAI API',
        version: API_VERSION,
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.use(`/api/${API_VERSION}/auth`, auth_routes_1.default);
app.use(`/api/${API_VERSION}/seniors`, seniors_routes_1.default);
app.use(`/api/${API_VERSION}/reminders`, reminders_routes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const startServer = () => {
    app.listen(PORT, () => {
        logger_1.default.info(`Server is running on port ${PORT}`);
        logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.default.info(`API Version: ${API_VERSION}`);
        if (process.env.ENABLE_REMINDER_SCHEDULER === 'true') {
            scheduler_service_1.default.start();
            logger_1.default.info('Scheduler service started');
        }
    });
};
const shutdown = () => {
    logger_1.default.info('Shutting down gracefully...');
    scheduler_service_1.default.stop();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map