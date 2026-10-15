const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');
const chalk = require('chalk');
const { execSync } = require('child_process');
const validateProjectName = require('validate-npm-package-name');

async function createHathorDapp(projectName) {
  console.log(chalk.bold.cyan('\n🎲 Create Hathor dApp\n'));

  // Get project name if not provided
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'What is your project name?',
      initial: 'my-hathor-dapp',
      validate: (value) => {
        const validation = validateProjectName(value);
        if (validation.validForNewPackages) {
          return true;
        }
        return 'Invalid project name: ' + (validation.errors || validation.warnings || []).join(', ');
      },
    });

    if (!response.projectName) {
      console.log(chalk.red('\n✖ Project creation cancelled\n'));
      process.exit(1);
    }

    projectName = response.projectName;
  }

  // Validate project name
  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    console.error(
      chalk.red(
        `\n✖ Cannot create a project named ${chalk.bold(projectName)} because of npm naming restrictions:\n`
      )
    );
    (validation.errors || validation.warnings || []).forEach((error) => {
      console.error(chalk.red(`  • ${error}`));
    });
    console.error();
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    console.error(
      chalk.red(`\n✖ Directory ${chalk.bold(projectName)} already exists. Please choose a different name.\n`)
    );
    process.exit(1);
  }

  // Ask for configuration
  const config = await prompts([
    {
      type: 'select',
      name: 'network',
      message: 'Which network will you primarily use?',
      choices: [
        { title: 'Testnet', value: 'testnet' },
        { title: 'Mainnet', value: 'mainnet' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'packageManager',
      message: 'Which package manager do you want to use?',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' },
        { title: 'pnpm', value: 'pnpm' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies now?',
      initial: true,
    },
  ]);

  console.log(chalk.cyan('\n📦 Creating project...\n'));

  try {
    // Create project directory
    fs.mkdirSync(projectPath);
    console.log(chalk.green('✓'), 'Created project directory');

    // Copy template files
    const templatePath = path.join(__dirname, 'template');
    fs.copySync(templatePath, projectPath);
    console.log(chalk.green('✓'), 'Copied template files');

    // Update package.json with project name
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = fs.readJSONSync(packageJsonPath);
    packageJson.name = projectName;
    fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 });
    console.log(chalk.green('✓'), 'Updated package.json');

    // Create .env file with network configuration
    const envContent = `# Snap Configuration
NEXT_PUBLIC_SNAP_ORIGIN=npm:@hathor/snap
# For local snap development:
# NEXT_PUBLIC_SNAP_ORIGIN=local:http://localhost:8080

# Network
NEXT_PUBLIC_DEFAULT_NETWORK=${config.network}

# Dice Contract (Update these after deploying your contract)
NEXT_PUBLIC_DICE_CONTRACT_ID=0x1111111111111111111111111111111111111111111111111111111111111111
NEXT_PUBLIC_DICE_BLUEPRINT_ID=hathor-dice

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=
`;
    fs.writeFileSync(path.join(projectPath, '.env.local'), envContent);
    console.log(chalk.green('✓'), 'Created .env.local file');

    // Install dependencies
    if (config.installDeps) {
      console.log(chalk.cyan('\n📥 Installing dependencies...\n'));

      const installCommands = {
        npm: 'npm install',
        yarn: 'yarn install',
        pnpm: 'pnpm install',
      };

      try {
        execSync(installCommands[config.packageManager], {
          cwd: projectPath,
          stdio: 'inherit',
        });
        console.log(chalk.green('\n✓'), 'Dependencies installed');
      } catch (error) {
        console.log(chalk.yellow('\n⚠'), 'Failed to install dependencies. You can install them manually later.');
      }
    }

    // Initialize git
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from create-hathor-dapp"', {
        cwd: projectPath,
        stdio: 'ignore',
      });
      console.log(chalk.green('✓'), 'Initialized git repository');
    } catch (error) {
      // Git init is optional, so we don't fail if it doesn't work
    }

    // Success message
    console.log(chalk.bold.green('\n✨ Success!'), `Created ${chalk.bold(projectName)} at ${projectPath}\n`);

    console.log('Inside that directory, you can run several commands:\n');
    console.log(chalk.cyan(`  ${config.packageManager} run dev`));
    console.log('    Starts the development server\n');
    console.log(chalk.cyan(`  ${config.packageManager} run build`));
    console.log('    Builds the app for production\n');
    console.log(chalk.cyan(`  ${config.packageManager} run start`));
    console.log('    Runs the built app in production mode\n');
    console.log(chalk.cyan(`  ${config.packageManager} run lint`));
    console.log('    Runs the linter\n');

    console.log('We suggest that you begin by typing:\n');
    console.log(chalk.cyan('  cd'), projectName);
    console.log(chalk.cyan(`  ${config.packageManager} run dev`));
    console.log('\nHappy hacking! 🎲\n');
  } catch (error) {
    console.error(chalk.red('\n✖ Error creating project:'), error.message);
    // Clean up on error
    if (fs.existsSync(projectPath)) {
      fs.removeSync(projectPath);
    }
    process.exit(1);
  }
}

module.exports = { createHathorDapp };
