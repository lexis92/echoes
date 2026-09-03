import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat config directly, so no FlatCompat wrapper.
const config = [
  {
    // Edge functions are Deno, with their own globals and remote imports this
    // Node-oriented setup cannot resolve.
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "supabase/functions/**"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      // A performance advisory from the React Compiler work, not a correctness
      // rule, and several of the places it fires are deliberate: reading
      // localStorage or the clock after mount is precisely how you avoid a
      // hydration mismatch, which is a real bug. Kept visible as a warning so
      // new instances still get reviewed, rather than switched off.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Build config predates ESM here and legitimately uses require().
    files: ["*.config.js", "*.config.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
