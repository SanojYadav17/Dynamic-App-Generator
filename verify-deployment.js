#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks all requirements before deploying
 */

const fs = require('fs');
const path = require('path');

const CHECKS = {
  files: [
    { name: 'package.json', required: true },
    { name: 'package-lock.json', required: false },
    { name: 'tsconfig.json', required: true },
    { name: 'next.config.mjs', required: true },
    { name: 'prisma/schema.prisma', required: true },
    { name: '.env.example', required: true },
    { name: 'README.md', required: true },
  ],
  dirs: [
    { name: 'src/app', required: true },
    { name: 'src/components', required: true },
    { name: 'src/lib', required: true },
  ],
};

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function runChecks() {
  console.log('\n🔍 Pre-Deployment Verification\n');

  let allPassed = true;

  // Check files
  console.log('📁 Checking required files:');
  CHECKS.files.forEach((file) => {
    const filePath = path.join(process.cwd(), file.name);
    const exists = checkFile(filePath);
    const status = exists ? '✅' : file.required ? '❌' : '⚠️';
    console.log(`  ${status} ${file.name}`);
    if (file.required && !exists) allPassed = false;
  });

  // Check directories
  console.log('\n📂 Checking required directories:');
  CHECKS.dirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir.name);
    const exists = checkFile(dirPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${dir.name}`);
    if (dir.required && !exists) allPassed = false;
  });

  // Check package.json content
  console.log('\n📦 Checking package.json configuration:');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasScript = (name) => name in pkg.scripts;
    
    console.log(`  ${hasScript('dev') ? '✅' : '❌'} dev script`);
    console.log(`  ${hasScript('build') ? '✅' : '❌'} build script`);
    console.log(`  ${hasScript('start') ? '✅' : '❌'} start script`);
    console.log(`  ${hasScript('lint') ? '✅' : '❌'} lint script`);
    
    if (!hasScript('build') || !hasScript('start')) {
      allPassed = false;
    }
  } catch (e) {
    console.log('  ❌ Failed to parse package.json');
    allPassed = false;
  }

  // Check .gitignore
  console.log('\n🔒 Checking environment safety:');
  try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    console.log(`  ${gitignore.includes('.env.local') ? '✅' : '⚠️'} .env.local in .gitignore`);
    console.log(`  ${gitignore.includes('node_modules') ? '✅' : '⚠️'} node_modules in .gitignore`);
    console.log(`  ${gitignore.includes('.next') ? '✅' : '⚠️'} .next in .gitignore`);
  } catch (e) {
    console.log('  ⚠️ .gitignore not found');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Ready for deployment!');
  } else {
    console.log('❌ Some checks failed - Fix issues before deploying');
  }
  console.log('='.repeat(50) + '\n');

  return allPassed ? 0 : 1;
}

process.exit(runChecks());
