import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { getPool } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createHealthRouter } from "./routes/health.js";

export function createApp({
    appConfig = config,
    poolProvider = getPool
} = {}) {
    const application = express();

    application.disable("x-powered-by");
    application.use(helmet());
    application.use((request, response, next) => {
        const origin = request.get("Origin");
        if (origin && !appConfig.frontendOrigins.includes(origin)) {
            return response.status(403).json({ error: "Origin not allowed" });
        }
        return next();
    });
    application.use(cors({
        origin(origin, callback) {
            callback(null, Boolean(origin && appConfig.frontendOrigins.includes(origin)));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    }));
    application.use(express.json({ limit: "16kb" }));
    application.use("/api/health", createHealthRouter(poolProvider));
    application.use(notFoundHandler);
    application.use(errorHandler);

    return application;
}

const app = createApp();
export default app;