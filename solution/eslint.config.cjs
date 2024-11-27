module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",  
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json", // Essential for TypeScript
  },
  plugins: ["react", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    // Consider adding a stricter preset if desired:
    // "plugin:react/jsx-runtime",  // if using the new JSX transform
    // "airbnb" or "xo-react" (after installing)
  ],
  rules: {
    // Add project-specific rules or override presets here
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off", // Disable no-console in dev
    "react/jsx-uses-react": "off", // Not needed with the new JSX transform
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" } ],  //  Useful exception
    // ... other custom rules
  },
  env: {
    browser: true,
    es2021: true, //  Or match to your 'compilerOptions.target' in tsconfig.json
    node: true,
  },
  settings: {
    react: {
      version: "detect", // Or specify a version if you have React version locked
    },
  },
  ignorePatterns: ["dist", "build", "node_modules", ".next"], // Common folders to ignore; adjust as needed.

};
