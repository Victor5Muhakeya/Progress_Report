import { Router } from "express";
import { z } from "zod";
import { getPool } from "../config/database.js";
import { validateRequest } from "../middleware/request-validation.js";

const router = Router();
const querySchema = z.object({
    check: z.enum(["application", "database"]).default("application")
}).strict();

router.get("/", validateRequest({ query: querySchema }), async (request, response) => {
    const check = request.validated.query.check;
    const result = {
        status: "ok",
        service: "eagles-progress-report-api",
        check,
        timestamp: new Date().toISOString()
    };

    if (check === "database") {
        try {
            await getPool().query("SELECT 1");
            result.database = "connected";
        } catch {
            result.status = "unavailable";
            result.database = "disconnected";
            return response.status(503).json(result);
        }
    }

    return response.json(result);
});

export default router;