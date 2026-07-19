import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AccessDomainError } from "@repo/audit-domain";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod";
import {
    ProjectArchivedError,
    ProjectNotFoundError,
    ProjectPermissionDeniedError,
} from "../../modules/project-membership/project-membership.service";

const response_message = {
    enum: {
        error: "error",
    },
} as const;

const default_error = {
    code: 500,
    message: "Something went wrong",
    type: "internal_server_error",
};

const safe_client_error_statuses = new Set([400, 413, 415]);

export const error_handler = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    if (error instanceof AccessDomainError) {
        return reply.status(503).send({
            error: {
                type: "access_evidence_unavailable",
                message: "Access evidence is temporarily unavailable",
            },
        });
    }

    if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send({ error: { type: "project_not_found", message: error.message } });
    }
    if (error instanceof ProjectPermissionDeniedError) {
        return reply.status(403).send({ error: { type: "project_permission_denied", message: error.message } });
    }
    if (error instanceof ProjectArchivedError) {
        return reply.status(409).send({ error: { type: "project_archived", message: error.message } });
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
        const field_errors = error.validation.map((validation_error) => {
            return {
                field: validation_error.instancePath.replace("/", ""),
                message: validation_error.message,
                type: "validation_error"
            }
        })

        return reply.status(400).send({
            code: 400,
            message: response_message.enum.error,
            path: request.url,
            result: field_errors,
            timestamp: new Date().toISOString(),
        } as const)
    }

    if (isResponseSerializationError(error)) {
        //TODO: look what does this do
        //taken from fastify-type-provider-zod documentation
        // return reply.code(500).send({
        //     error: 'Internal Server Error',
        //     message: "Response doesn't match the schema",
        //     statusCode: 500,
        //     details: {
        //         issues: error.cause.issues,
        //         method: error.method,
        //         url: error.url,
        //     },
        // })
        return reply.code(500).send({
            code: 500,
            message: response_message.enum.error,
            path: request.url,
            result: [
                {
                    message: "Response doesn't match the schema",
                    field: "",
                    type: "response_serialization_error"
                }
            ],
            timestamp: new Date().toISOString(),
        })
    }

    if (
        error.statusCode
        && safe_client_error_statuses.has(error.statusCode)
    ) {
        return reply.status(error.statusCode).send({
            code: error.statusCode,
            path: request.url,
            message: response_message.enum.error,
            timestamp: new Date().toISOString(),
            result: [
                {
                    message: error.statusCode === 413 ? "Request body is too large" : "Invalid request body",
                    type: error.code ?? "client_request_error",
                    field: ""
                },
            ],
        } as const);
    }

    request.log.error({
        err: error,
        path: request.url,
    }, "Unhandled request error");

    return reply.status(default_error.code).send({
        code: default_error.code,
        path: request.url,
        message: response_message.enum.error,
        timestamp: new Date().toISOString(),
        result: [
            {
                message: default_error.message,
                type: default_error.type,
                field: ""
            },
        ],
    } as const);
};
