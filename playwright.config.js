const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './frontend/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true
  },
  reporter: [['line']]
});
