import { Logger } from "@nestjs/common";

type AssertLevel = "debug" | "warn" | "error";
type AssertName = "ASSERT_VERIFY" | "ASSERT_WARN" | "ASSERT_THROW" | "ASSERT_MUST";

const logger = new Logger("Assert");

export function ASSERT_VERIFY(condition: unknown, description: string) {
    if (condition) {
        return true;
    }

    writeAssertLog("debug", "ASSERT_VERIFY", description);
    return false;
}

export function ASSERT_WARN(condition: unknown, description: string) {
    if (condition) {
        return true;
    }

    writeAssertLog("warn", "ASSERT_WARN", description);
    return false;
}

export function ASSERT_THROW(condition: unknown, description: string): asserts condition {
    if (condition) {
        return;
    }

    writeAssertLog("warn", "ASSERT_THROW", description);
    throw new Error(description);
}

export function ASSERT_MUST(condition: unknown, description: string): asserts condition {
    if (condition) {
        return;
    }

    writeAssertLog("error", "ASSERT_MUST", description);
    throw new Error(description);
}

function writeAssertLog(level: AssertLevel, assertName: AssertName, description: string) {
    const logMessage = `[${assertName}] ${description}`;
    if (level === "debug") {
        logger.debug(logMessage);
        return;
    }

    if (level === "warn") {
        logger.warn(logMessage);
        return;
    }

    logger.error(logMessage);
}
