import { QueryFailedError } from "typeorm";

const POSTGRES_UNIQUE_CONSTRAINT_CODE = "23505";

type PostgresDriverError = {
    code?: unknown;
};

export function isUniqueConstraintError(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
        return false;
    }

    const driverError = error.driverError as PostgresDriverError;

    return driverError.code === POSTGRES_UNIQUE_CONSTRAINT_CODE;
}
