export type DomainErrorDefinition = {
    statusCode: number;
    code: string;
    message: string;
};

export class DomainError extends Error {
    readonly statusCode: number;
    readonly code: string;

    constructor(error: DomainErrorDefinition) {
        super(error.message);
        this.name = "DomainError";
        this.statusCode = error.statusCode;
        this.code = error.code;
    }
}

export function createDomainError(error: DomainErrorDefinition) {
    return new DomainError(error);
}
