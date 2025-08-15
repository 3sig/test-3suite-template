#!/usr/bin/env node

import { execSync } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function checkUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.error('❌ There are uncommitted changes. Please commit or stash them first:');
      console.error(status);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking git status:', error.message);
    process.exit(1);
  }
}

function promptVersionType() {
  return new Promise((resolve) => {
    console.log('\nSelect version increment type:');
    console.log('1. patch (x.x.X) - Bug fixes');
    console.log('2. minor (x.X.x) - New features');
    console.log('3. major (X.x.x) - Breaking changes');

    rl.question('\nEnter your choice (1/2/3): ', (answer) => {
      const choice = answer.trim();
      switch (choice) {
        case '1':
          resolve('patch');
          break;
        case '2':
          resolve('minor');
          break;
        case '3':
          resolve('major');
          break;
        default:
          console.log('❌ Invalid choice. Please enter 1, 2, or 3.');
          resolve(promptVersionType());
      }
    });
  });
}

async function main() {
  console.log('Checking for uncommitted changes...');
  checkUncommittedChanges();

  console.log('No uncommitted changes found.');

  const versionType = await promptVersionType();
  rl.close();

  try {
    console.log(`\nIncrementing ${versionType} version...`);
    const output = execSync(`npm version ${versionType}`, { encoding: 'utf8' });
    const newVersion = output.trim();
    console.log(`Version updated to ${newVersion}`);

    console.log('Tagging current commit...');
    execSync(`git tag -a v${newVersion} -m "Release ${newVersion}"`, { stdio: 'inherit' });

    console.log('Pushing tags to origin...');
    execSync(`git push origin tag v${newVersion}`, { stdio: 'inherit' });

    console.log(`Successfully released ${newVersion}!`);

  } catch (error) {
    console.error('❌ Error during release process:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
