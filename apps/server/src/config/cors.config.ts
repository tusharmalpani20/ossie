import { is_production_runtime } from "./runtime.config";

const allowed_headers = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Ossie-Client',
    'X-Ossie-Access-Surface',
    'Idempotency-Key',
];

const parse_origins = (value: string | undefined) => (
    (value || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

export const get_cors_config = () => {
    const production = is_production_runtime();
    const allowed_origins = parse_origins(process.env.OSSIE_CORS_ALLOWED_ORIGINS);

    if (production && allowed_origins.length === 0) {
        throw new Error("OSSIE_CORS_ALLOWED_ORIGINS must be defined in production");
    }

    const is_origin_allowed = (origin: string | undefined) => {
        if (!origin) return true;
        if (!production) return true;
        return allowed_origins.includes(origin);
    };

    return {
        is_origin_allowed,
        fastify_options: {
            origin: (
                origin: string | undefined,
                cb: (error: Error | null, allowed: boolean) => void
            ) => cb(null, is_origin_allowed(origin)),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true,
            allowedHeaders: allowed_headers,
            preflight: true,
            preflightContinue: false,
        },
    };
};
