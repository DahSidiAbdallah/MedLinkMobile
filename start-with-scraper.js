/**
 * Start both the MedLink app and the scraper service
 * This ensures the scraper is available as a fallback for drug verification
 */

const { spawn } = require('child_process');
const { checkScraperRunning, checkPython } = require('./start-scraper');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

let scraperProc = null;
let appProc = null;

async function startServices() {
  log(colors.magenta, 'MedLink', '='.repeat(60));
  log(colors.magenta, 'MedLink', 'Starting MedLink with Drug Information Scraper');
  log(colors.magenta, 'MedLink', '='.repeat(60));

  // Check if scraper is already running
  const scraperRunning = await checkScraperRunning();
  
  if (!scraperRunning) {
    log(colors.blue, 'Setup', 'Starting scraper service...');
    
    // Check for Python
    const pythonCmd = await checkPython();
    
    if (!pythonCmd) {
      log(colors.yellow, 'Setup', 'Python not found - scraper will not be available');
      log(colors.yellow, 'Setup', 'App will use OpenFDA and other sources only');
    } else {
      // Start scraper in background
      scraperProc = spawn('node', ['start-scraper.js'], {
        stdio: 'inherit',
        detached: false,
      });

      scraperProc.on('error', (err) => {
        log(colors.red, 'Scraper', `Failed to start: ${err.message}`);
      });

      // Give scraper time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const nowRunning = await checkScraperRunning();
      if (nowRunning) {
        log(colors.green, 'Setup', '✓ Scraper service started successfully');
      } else {
        log(colors.yellow, 'Setup', 'Scraper may still be initializing...');
      }
    }
  } else {
    log(colors.green, 'Setup', '✓ Scraper already running');
  }

  // Start the main app
  log(colors.blue, 'Setup', 'Starting MedLink app...');
  log(colors.cyan, 'MedLink', '='.repeat(60));

  appProc = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
  });

  appProc.on('error', (err) => {
    log(colors.red, 'App', `Failed to start: ${err.message}`);
    cleanup();
  });

  appProc.on('close', (code) => {
    log(colors.yellow, 'App', `Exited with code ${code}`);
    cleanup();
  });
}

function cleanup() {
  log(colors.yellow, 'Shutdown', 'Cleaning up...');
  
  if (scraperProc && !scraperProc.killed) {
    log(colors.yellow, 'Shutdown', 'Stopping scraper...');
    scraperProc.kill('SIGTERM');
  }
  
  if (appProc && !appProc.killed) {
    log(colors.yellow, 'Shutdown', 'Stopping app...');
    appProc.kill('SIGTERM');
  }

  setTimeout(() => {
    if (scraperProc && !scraperProc.killed) {
      scraperProc.kill('SIGKILL');
    }
    if (appProc && !appProc.killed) {
      appProc.kill('SIGKILL');
    }
    process.exit(0);
  }, 2000);
}

// Handle shutdown signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Start everything
startServices().catch((err) => {
  log(colors.red, 'Error', err.message);
  cleanup();
});

