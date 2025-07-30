// eslint.config.js
import js from "@eslint/js";

export default [
    { ignores: ["dist/"] },
    // Apply recommended rules to all files
    js.configs.recommended,

    // Custom configuration object
    {
        files: ["src/**/*.js"], // Target specific files
        rules: {
            "no-unused-vars": "warn",
            "no-console": "warn",
        },
    },
];