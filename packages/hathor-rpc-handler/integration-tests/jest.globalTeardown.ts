import { execSync } from 'child_process';
import * as path from 'path';

const integrationTestsDir = __dirname; // Correctly refers to the integration-tests directory
const composeFile = path.join(integrationTestsDir, 'docker-compose.yml');

export default async () => {
  console.log('\nTearing down integration test environment...');
  try {
    execSync(`docker compose -f "${composeFile}" down -v --remove-orphans`, { stdio: 'inherit' });
    console.log('Docker containers stopped and removed successfully.');
  } catch (error) {
    console.error('Failed to stop Docker containers:', error);
    // Don't exit here, as tests might have finished, but teardown failed.
  }
}; 