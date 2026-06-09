export type AuthEnv = {
    secret: string;
    webOrigin: string;
    signupRedirectPath: string;
    errorRedirectPath: string;
    sessionCookieSecure: boolean;
};

export type GitHubOAuthEnv = {
    apiOrigin: string;
    clientId: string;
    clientSecret: string;
};
