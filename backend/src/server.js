import app from "./app.js";
import { config } from "./config/env.js";
import { closePool } from "./config/database.js";

const server = app.listen(config.port, () => {
    console.log(`API listening on port ${config.port} (${config.nodeEnv})`);
});

let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down.`);

    server.close(async error => {
        if (error) {
            console.error("HTTP server shutdown failed.", error);
            process.exitCode = 1;
        }

        try {
            await closePool();
        } catch (poolError) {
            console.error("Database pool shutdown failed.", poolError);
            process.exitCode = 1;
        }
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));