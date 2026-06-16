import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import checkFile from "eslint-plugin-check-file";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

const restrictImports = (patterns) => [
    "error",
    {
        patterns
    }
];

export default [
    {
        // 설치 파일과 빌드 산출물은 검사하지 않는다.
        ignores: [
            "node_modules/**",
            ".codex/**",
            "**/dist/**",
            "apps/web-client/src/routeTree.gen.ts",
            "apps/web-client/src/shared/api/generated/**",
            "packages/ui/src/components/**",
            "packages/ui/src/hooks/use-mobile.ts"
        ]
    },

    js.configs.recommended,

    {
        name: "common typescript rules",
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                ecmaVersion: "latest",
                sourceType: "module"
            }
        },
        plugins: {
            "@typescript-eslint": tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "no-undef": "off"
        }
    },

    {
        name: "file naming rules",
        files: ["**/*.{ts,tsx}"],
        ignores: [
            "apps/web-client/src/routes/**/*.{ts,tsx}",
            "apps/web-client/src/routeTree.gen.ts",
            "apps/web-client/src/shared/api/generated/**/*.{ts,tsx}"
        ],
        plugins: {
            "check-file": checkFile
        },
        rules: {
            // 소스 파일명을 예측 가능하게 유지한다. *.spec.ts 같은 중간 확장자는 허용한다.
            "check-file/filename-naming-convention": [
                "error",
                {
                    "**/*.{ts,tsx}": "KEBAB_CASE"
                },
                {
                    ignoreMiddleExtensions: true
                }
            ],

            // src 하위 폴더명을 읽기 쉽게 유지한다.
            "check-file/folder-naming-convention": [
                "error",
                {
                    "apps/**/src/**/!(__tests__)": "KEBAB_CASE",
                    "packages/**/src/**/!(__tests__)": "KEBAB_CASE"
                }
            ]
        }
    },

    {
        name: "web-client rules",
        files: ["apps/web-client/**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser
        },
        plugins: {
            "react-hooks": reactHooks
        },
        rules: {
            // 흔한 React Hooks 실수를 lint 단계에서 잡는다.
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",

            "no-restricted-syntax": [
                "error",
                {
                    selector: "JSXExpressionContainer > ArrowFunctionExpression",
                    message: "JSX 안에 익명 화살표 함수를 직접 만들지 말고 이름 있는 함수로 전달하세요."
                },
                {
                    selector: "JSXExpressionContainer > FunctionExpression",
                    message: "JSX 안에 익명 함수를 직접 만들지 말고 이름 있는 함수로 전달하세요."
                }
            ],

            // Web은 API를 HTTP로 호출하고, shadcn 내부 유틸은 UI 패키지 안에 둔다.
            "no-restricted-imports": restrictImports([
                "@nmm/api-server",
                "@nmm/api-server/*",
                "@nmm/ui/lib/*",
                "@/components/ui/*",
                "@/lib/utils",
                "@nestjs/*",
                "node:*"
            ])
        }
    },

    {
        name: "api-server rules",
        files: ["apps/api-server/**/*.ts"],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            // API는 Web 빌드/런타임 코드에 의존하지 않는다.
            "no-restricted-imports": restrictImports([
                "@nmm/web-client",
                "@nmm/web-client/*",
                "@nmm/ui",
                "@nmm/ui/*",
                "react",
                "react-dom",
                "react-dom/*",
                "vite",
                "@vitejs/*"
            ])
        }
    },

    {
        name: "mcp-server rules",
        files: ["apps/mcp-server/**/*.ts"],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            // MCP 서버는 API 서버를 HTTP로만 호출하고 다른 앱 런타임에 의존하지 않는다.
            "no-restricted-imports": restrictImports([
                "@nmm/api-server",
                "@nmm/api-server/*",
                "@nmm/web-client",
                "@nmm/web-client/*",
                "@nmm/ui",
                "@nmm/ui/*",
                "@nestjs/*",
                "react",
                "react-dom",
                "react-dom/*",
                "vite",
                "@vitejs/*",
                "typeorm"
            ])
        }
    },

    {
        name: "shared package rules",
        files: ["packages/shared/**/*.ts"],
        rules: {
            // Shared는 프레임워크와 런타임 의존성을 두지 않는다.
            "no-restricted-imports": restrictImports([
                "@nmm/web-client",
                "@nmm/web-client/*",
                "@nmm/api-server",
                "@nmm/api-server/*",
                "@nmm/ui",
                "@nmm/ui/*",
                "@nestjs/*",
                "react",
                "react-dom",
                "react-dom/*",
                "vite",
                "@vitejs/*",
                "node:*"
            ])
        }
    },

    {
        name: "ui package rules",
        files: ["packages/ui/**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser
        },
        rules: {
            // UI 패키지는 앱/서버 도메인에 의존하지 않고 shadcn 내부 import는 package imports를 쓴다.
            "no-restricted-imports": restrictImports([
                "@/*",
                "@nmm/web-client",
                "@nmm/web-client/*",
                "@nmm/api-server",
                "@nmm/api-server/*",
                "@nmm/shared",
                "@nmm/shared/*",
                "@nestjs/*",
                "vite",
                "@vitejs/*",
                "node:*"
            ])
        }
    },

    {
        name: "node config files",
        files: ["*.config.mjs", "eslint.config.mjs"],
        languageOptions: {
            globals: globals.node
        }
    },

    // 포맷 규칙은 Prettier가 담당한다.
    eslintConfigPrettier
];
