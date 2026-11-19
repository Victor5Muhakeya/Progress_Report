export function notFoundHandler(request, response) {
    response.status(404).json({ error: "Route not found" });
}

export function errorHandler(error, request, response, next) {
    if (response.headersSent) return next(error);

    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    const message = status === 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Internal server error";

    if (status >= 500) console.error(error);
    response.status(status).json({ error: message });
}