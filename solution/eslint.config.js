export default {
  extends: ["eslint:recommended"],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "error"
  },
  env: {
    browser: true,
    node: true
  }
};
