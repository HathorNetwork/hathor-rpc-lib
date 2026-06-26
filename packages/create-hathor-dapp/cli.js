#!/usr/bin/env node

const { createHathorDapp } = require('./index');

// Get project name from command line args
const projectName = process.argv[2];

createHathorDapp(projectName).catch((error) => {
  console.error('Error creating Hathor dApp:', error);
  process.exit(1);
});
