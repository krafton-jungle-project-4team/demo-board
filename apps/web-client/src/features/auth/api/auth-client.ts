import { createAuthClient } from "better-auth/client";
import { clientEnv } from "@/shared/env/client-env";

export const authClient = createAuthClient({
    baseURL: clientEnv.apiOrigin
});

export function signInWithGitHub(callbackURL: string) {
    return authClient.signIn.social({
        provider: "github",
        callbackURL,
        newUserCallbackURL: "/auth/complete-signup",
        errorCallbackURL: "/auth/error"
    });
}
