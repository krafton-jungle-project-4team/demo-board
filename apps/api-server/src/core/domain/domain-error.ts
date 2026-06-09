export type DomainErrorDefinition<TCode extends string = string> = {
    code: TCode;
    message: string;
};

export type DomainErrorDefinitions = Record<string, DomainErrorDefinition>;

export type DomainErrorCode<TDefinitions extends DomainErrorDefinitions> = TDefinitions[keyof TDefinitions]["code"];

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

export function defineDomainErrors<const TDefinitions extends DomainErrorDefinitions>(definitions: TDefinitions) {
    return definitions;
}

export function isDomainErrorCode<TDefinitions extends DomainErrorDefinitions>(
    definitions: TDefinitions,
    code: string
): code is DomainErrorCode<TDefinitions> {
    return Object.values(definitions).some((definition) => definition.code === code);
}
