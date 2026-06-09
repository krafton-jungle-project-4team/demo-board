import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

export function signInWithGitHub(callbackURL = "/posts") {
    return authClient.signIn.social({
        provider: "github",
        callbackURL,
        newUserCallbackURL: "/auth/complete-signup",
        errorCallbackURL: "/auth/error"
    });
}
