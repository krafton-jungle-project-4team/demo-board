import path from "node:path";
import { config } from "dotenv";

const envFilePath = path.resolve(__dirname, "../../../.env");

export function loadServerEnv() {
    const result = config({ path: envFilePath, override: true });

    if (result.error) {
        throw new Error(`Server environment file is required: ${envFilePath}`);
    }
}
