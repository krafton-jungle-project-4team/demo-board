export type DomainErrorDefinition<TCode extends string> = {
    code: TCode;
    message: string;
};

export class DomainError<TCode extends string = string> extends Error {
    readonly code: TCode;

    constructor(definition: DomainErrorDefinition<TCode>) {
        super(definition.message);
        this.name = "DomainError";
        this.code = definition.code;
    }
}

export function createDomainError<TCode extends string>(definition: DomainErrorDefinition<TCode>) {
    return new DomainError(definition);
}
