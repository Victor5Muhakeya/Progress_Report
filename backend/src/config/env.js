import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.preprocess(
        value => value === "" ? undefined : value,
        z.string().trim().min(1).optional()
    ),
    FRONTEND_ORIGINS: z.string()
        .default("http://localhost:5501,http://127.0.0.1:5501")
        .transform(value => value.split(",").map(origin => origin.trim()).filter(Boolean))
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration:", result.error.flatten().fieldErrors);
    process.exit(1);
}

if (result.data.NODE_ENV === "production" && !result.data.DATABASE_URL) {
    console.error("DATABASE_URL is required in production.");
    process.exit(1);
}

export const config = {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    databaseUrl: result.data.DATABASE_URL,
    frontendOrigins: result.data.FRONTEND_ORIGINS
};