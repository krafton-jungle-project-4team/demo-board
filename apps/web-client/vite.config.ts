import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

const apiProxy = {
    "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
    }
};

export default defineConfig(({ mode }) => {
    const useReactProfiling = mode === "profile";

    return {
        plugins: [
            tanstackRouter({
                target: "react",
                autoCodeSplitting: true
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
