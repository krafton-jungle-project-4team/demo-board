import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: createAuthBaseURL()
});

function createAuthBaseURL() {
    return new URL("/api/auth", import.meta.env.VITE_NMM_API_ORIGIN || window.location.origin).toString();
}
