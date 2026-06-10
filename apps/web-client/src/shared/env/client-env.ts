const apiOrigin = import.meta.env.VITE_NMM_API_ORIGIN;

if (!apiOrigin) {
    throw new Error("Required environment variable is missing: VITE_NMM_API_ORIGIN");
}

export const clientEnv = {
    apiOrigin
};
