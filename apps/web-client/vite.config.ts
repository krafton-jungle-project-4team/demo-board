import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const useReactProfiling = mode === "profile";
    const env = loadEnv(mode, import.meta.dirname, "");
    const apiOrigin = env.VITE_NMM_API_ORIGIN || "http://localhost:3000";
    const apiProxy = {
        "/api": {
            target: apiOrigin,
            changeOrigin: true
        }
    };

    return {
        plugins: [
            tanstackRouter({
                target: "react"
            }),
            react(),
            tailwindcss()
        ],
        resolve: {
            alias: [
                ...(useReactProfiling ? [{ find: "react-dom/client", replacement: "react-dom/profiling" }] : []),
                { find: "@", replacement: `${import.meta.dirname}/src` }
            ]
        },
        server: {
            port: 5173,
            proxy: apiProxy
        },
        preview: {
            port: 4173,
            proxy: apiProxy
        }
    };
});
