import time
import subprocess
import sys
import os

# How often to update (in seconds): e.g., 86400 = 24 hours
UPDATE_INTERVAL = 86400  # once per day

# Path to the batch script
BATCH_SCRIPT = os.path.join(os.path.dirname(__file__), 'update_all_recalls.bat')

def run_update():
    print('Running recall update batch script...')
    result = subprocess.run([BATCH_SCRIPT], shell=True)
    if result.returncode == 0:
        print('Recall files updated successfully.')
    else:
        print('Recall update failed.', file=sys.stderr)

if __name__ == "__main__":
    while True:
        run_update()
        print(f'Waiting {UPDATE_INTERVAL/3600:.1f} hours for next update...')
        time.sleep(UPDATE_INTERVAL)
