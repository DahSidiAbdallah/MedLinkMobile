import time
import subprocess
import sys
import os

# How often to update (in seconds): e.g., 86400 = 24 hours
UPDATE_INTERVAL = 86400  # once per day

# Path to the wrapper script
WRAPPER_SCRIPT = os.path.join(os.path.dirname(__file__), 'run_and_merge_recalls.py')


def run_update():
    print('Running full recall scrape, normalization, and merge...')
    result = subprocess.run([sys.executable, WRAPPER_SCRIPT], shell=False)
    if result.returncode == 0:
        print('All recall files updated and merged successfully.')
    else:
        print('Recall update failed.', file=sys.stderr)

if __name__ == "__main__":
    while True:
        run_update()
        print(f'Waiting {UPDATE_INTERVAL/3600:.1f} hours for next update...')
        time.sleep(UPDATE_INTERVAL)
