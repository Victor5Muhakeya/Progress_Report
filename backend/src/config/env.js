import "dotenv/config";

const developmentOrigins = [
    "http://localhost:5501",
    "http://127.0.0.1:5501"
];

export function validateDatabaseUrl(value) {
    if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
        throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }

    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }

    if (
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        !url.hostname ||
        !url.pathname ||
        url.pathname === "/" ||
        url.hash
    ) {
        throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }

    if ([...url.searchParams.keys()].some(parameter => parameter.toLowerCase().startsWith("ssl"))) {
        throw new Error("DATABASE_URL must not include SSL parameters; TLS is configured by the backend.");
    }
}

function parsePort(value) {
    if (value === undefined) return 3000;
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    const port = Number(value);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    return port;
}

function parseFrontendOrigins(value, nodeEnv) {
    if (value === undefined && nodeEnv !== "production") return developmentOrigins;
    if (typeof value !== "string" || value.length === 0) {
        throw new Error("FRONTEND_ORIGINS must contain one or more exact HTTP/HTTPS origins.");
    }

    const origins = value.split(",").map(origin => origin.trim());
    if (origins.some(origin => origin.length === 0)) {
        throw new Error("FRONTEND_ORIGINS must contain one or more exact HTTP/HTTPS origins.");
    }

    const validOrigins = origins.map(origin => {
        let url;
        try {
            url = new URL(origin);
        } catch {
            throw new Error("FRONTEND_ORIGINS must contain only exact HTTP/HTTPS origins.");
        }

        if (
            !["http:", "https:"].includes(url.protocol) ||
            !url.hostname ||
            url.origin !== origin ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
        ) {
            throw new Error("FRONTEND_ORIGINS must contain only exact HTTP/HTTPS origins.");
        }

        return origin;
    });

    return [...new Set(validOrigins)];
}

export function parseEnv(environment = {}) {
    const nodeEnv = environment.NODE_ENV ?? "development";
    if (!["development", "test", "production"].includes(nodeEnv)) {
        throw new Error("NODE_ENV must be development, test, or production.");
    }

    const port = parsePort(environment.PORT);
    const configuredDatabaseUrl = environment.DATABASE_URL;
    if (configuredDatabaseUrl !== undefined && typeof configuredDatabaseUrl !== "string") {
        throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
    const rawDatabaseUrl = configuredDatabaseUrl === "" ? undefined : configuredDatabaseUrl;
    if (nodeEnv === "production" && !rawDatabaseUrl) {
        throw new Error("DATABASE_URL is required in production.");
    }
    if (rawDatabaseUrl) validateDatabaseUrl(rawDatabaseUrl);

    return {
        nodeEnv,
        port,
        databaseUrl: rawDatabaseUrl,
        frontendOrigins: parseFrontendOrigins(environment.FRONTEND_ORIGINS, nodeEnv)
    };
}

export const config = parseEnv(process.env);
