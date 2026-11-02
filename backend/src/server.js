import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { validateEnvironment } from './config/env.js';

try {
  validateEnvironment();
  await connectDatabase();
  app.listen(env.port, () => console.log(`Backend listening on port ${env.port}`));
} catch (error) {
  console.error('Backend startup failed:', error);
  process.exitCode = 1;
}
