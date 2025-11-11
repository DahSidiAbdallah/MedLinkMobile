/**
 * Start the web scraper service for drug information fallback
 * This script starts the Flask scraper API on port 5001
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SCRAPER_DIR = path.join(__dirname, 'autoscrape');
const SCRAPER_PORT = 5001;
const SCRAPER_HOST = 'localhost';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}[Scraper]${colors.reset} ${message}`);
}

// Check if Python is installed
function checkPython() {
  return new Promise((resolve) => {
    const pythonCommands = ['python3', 'python'];
    let found = false;

    const tryCommand = (cmd) => {
      const proc = spawn(cmd, ['--version'], { stdio: 'pipe' });
      proc.on('close', (code) => {
        if (code === 0 && !found) {
          found = true;
          log(colors.green, `Found Python: ${cmd}`);
          resolve(cmd);
        } else if (!found && cmd === pythonCommands[pythonCommands.length - 1]) {
          resolve(null);
        }
      });
      proc.on('error', () => {
        if (!found && cmd === pythonCommands[pythonCommands.length - 1]) {
          resolve(null);
        }
      });
    };

    pythonCommands.forEach(tryCommand);
  });
}

// Check if scraper is already running
function checkScraperRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://${SCRAPER_HOST}:${SCRAPER_PORT}/scrape?code=__health_check__`, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Install Python dependencies
async function installDependencies(pythonCmd) {
  log(colors.blue, 'Checking Python dependencies...');
  
  const requirementsFile = path.join(SCRAPER_DIR, 'requirements.txt');
  if (!fs.existsSync(requirementsFile)) {
    log(colors.yellow, 'requirements.txt not found, skipping dependency install');
    return true;
  }

  return new Promise((resolve) => {
    const pip = spawn(pythonCmd, ['-m', 'pip', 'install', '-r', requirementsFile], {
      cwd: SCRAPER_DIR,
      stdio: 'inherit',
    });

    pip.on('close', (code) => {
      if (code === 0) {
        log(colors.green, 'Dependencies installed successfully');
        resolve(true);
      } else {
        log(colors.yellow, `Dependency installation exited with code ${code}`);
        resolve(false);
      }
    });

    pip.on('error', (err) => {
      log(colors.yellow, `Could not install dependencies: ${err.message}`);
      resolve(false);
    });
  });
}

// Start the scraper service
async function startScraper(pythonCmd) {
  log(colors.cyan, `Starting scraper service on port ${SCRAPER_PORT}...`);

  const scraperScript = path.join(SCRAPER_DIR, 'scraper_api.py');
  
  if (!fs.existsSync(scraperScript)) {
    log(colors.red, `Scraper script not found at ${scraperScript}`);
    return null;
  }

  const proc = spawn(pythonCmd, [scraperScript], {
    cwd: SCRAPER_DIR,
    stdio: 'inherit',
  });

  proc.on('error', (err) => {
    log(colors.red, `Failed to start scraper: ${err.message}`);
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log(colors.red, `Scraper exited with code ${code}`);
    }
  });

  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify it's running
  const running = await checkScraperRunning();
  if (running) {
    log(colors.green, `✓ Scraper service running at http://${SCRAPER_HOST}:${SCRAPER_PORT}`);
  } else {
    log(colors.yellow, 'Scraper started but health check failed. It may still be initializing...');
  }

  return proc;
}

// Main function
async function main() {
  log(colors.cyan, '='.repeat(60));
  log(colors.cyan, 'MedLink Drug Information Scraper Service');
  log(colors.cyan, '='.repeat(60));

  // Check if already running
  log(colors.blue, 'Checking if scraper is already running...');
  const alreadyRunning = await checkScraperRunning();
  if (alreadyRunning) {
    log(colors.green, `✓ Scraper already running at http://${SCRAPER_HOST}:${SCRAPER_PORT}`);
    log(colors.cyan, 'No need to start another instance.');
    return;
  }

  // Check Python
  log(colors.blue, 'Checking for Python installation...');
  const pythonCmd = await checkPython();
  
  if (!pythonCmd) {
    log(colors.red, '✗ Python not found!');
    log(colors.yellow, 'Please install Python 3.7+ from https://www.python.org/');
    log(colors.yellow, 'The scraper service will not be available.');
    log(colors.yellow, 'The app will still work using OpenFDA and other sources.');
    process.exit(1);
  }

  // Install dependencies
  const depsInstalled = await installDependencies(pythonCmd);
  if (!depsInstalled) {
    log(colors.yellow, 'Warning: Could not verify dependencies');
    log(colors.yellow, 'The scraper may not work correctly');
  }

  // Start scraper
  const scraperProc = await startScraper(pythonCmd);
  
  if (!scraperProc) {
    log(colors.red, '✗ Failed to start scraper service');
    log(colors.yellow, 'The app will still work using OpenFDA and other sources.');
    process.exit(1);
  }

  log(colors.cyan, '='.repeat(60));
  log(colors.green, '✓ Scraper service is ready!');
  log(colors.cyan, 'Press Ctrl+C to stop');
  log(colors.cyan, '='.repeat(60));

  // Handle shutdown
  process.on('SIGINT', () => {
    log(colors.yellow, 'Shutting down scraper service...');
    scraperProc.kill('SIGTERM');
    setTimeout(() => {
      scraperProc.kill('SIGKILL');
      process.exit(0);
    }, 2000);
  });

  process.on('SIGTERM', () => {
    scraperProc.kill('SIGTERM');
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch((err) => {
    log(colors.red, `Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { startScraper, checkScraperRunning, checkPython };

