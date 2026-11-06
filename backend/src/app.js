import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import healthRouter from "./routes/health.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        callback(null, !origin || config.frontendOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "16kb" }));
app.use("/api/health", healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;