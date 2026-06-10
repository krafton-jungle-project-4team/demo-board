import { createAuthClient } from "better-auth/client";
import { clientEnv } from "@/shared/env/client-env";

export const authClient = createAuthClient({
    baseURL: clientEnv.apiOrigin
});

export function signInWithGitHub(callbackURL: string) {
    return authClient.signIn.social({
        provider: "github",
        callbackURL: createWebURL(callbackURL),
        newUserCallbackURL: createWebURL("/auth/complete-signup"),
        errorCallbackURL: createWebURL("/auth/error")
    });
}

function createWebURL(path: string) {
    return new URL(path, window.location.origin).toString();
}
