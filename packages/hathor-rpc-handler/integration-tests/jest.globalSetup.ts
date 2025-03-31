import { execSync } from 'child_process';
import * as path from 'path';

const integrationTestsDir = __dirname; // Correctly refers to the integration-tests directory
const composeFile = path.join(integrationTestsDir, 'docker-compose.yml');

export default async () => {
  console.log('\nSetting up integration test environment...');
  try {
    // Use --wait to ensure services are healthy/running before proceeding
    execSync(`docker compose -f "${composeFile}" up -d --wait`, { stdio: 'inherit' });
    console.log('Docker containers started successfully.');
    // Add a small delay just in case services need a moment to fully initialize after becoming "healthy"
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds delay
    console.log('Integration test environment setup complete.');
  } catch (error) {
    console.error('Failed to start Docker containers:', error);
    // Optionally, try to bring down containers if setup failed partially
    try {
      execSync(`docker compose -f "${composeFile}" down`, { stdio: 'inherit' });
    } catch (downError) {
      console.error('Failed to run docker compose down after setup error:', downError);
    }
    process.exit(1); // Exit if setup fails
  }
}; 
