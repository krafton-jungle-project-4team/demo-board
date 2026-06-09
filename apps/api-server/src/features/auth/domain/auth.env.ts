export type AuthEnv = {
    webOrigin: string;
    loginRedirectPath: string;
    signupRedirectPath: string;
    errorRedirectPath: string;
    sessionCookieSecure: boolean;
};

export type GitHubOAuthEnv = {
    apiOrigin: string;
    clientId: string;
    clientSecret: string;
};
