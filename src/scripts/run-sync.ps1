# This script is used to run the sync-us-data.js file
# with proper setup for ESM modules

# Navigate to the project root 
cd ..
Write-Host "Syncing data from data.ts to Firestore..."

# Run the sync script with Node.js and TypeScript support
npx tsx src/scripts/sync-us-data.js

Write-Host "Script completed!"
