export function validateRequest(schemas) {
    return (request, response, next) => {
        const validated = {};
        const errors = {};

        for (const [target, schema] of Object.entries(schemas)) {
            const result = schema.safeParse(request[target]);
            if (result.success) {
                validated[target] = result.data;
            } else {
                errors[target] = result.error.flatten();
            }
        }

        if (Object.keys(errors).length) {
            return response.status(400).json({ error: "Invalid request", details: errors });
        }

        request.validated = validated;
        return next();
    };
}