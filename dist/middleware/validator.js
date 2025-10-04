"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const errorHandler_1 = require("./errorHandler");
const validate = (schema) => {
    return (req, _res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                throw new errorHandler_1.AppError(`Validation error: ${messages.join(', ')}`, 400);
            }
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validator.js.map