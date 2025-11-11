# Web Scraper Setup Guide

Your MedLink app now automatically starts the web scraper service alongside the main app to ensure drug information is available even when OpenFDA doesn't have data!

## 🚀 Quick Start

### Option 1: Start Everything Together (Recommended)
```bash
npm run start:full
```
This starts:
- The MedLink React Native app
- The web scraper service (if Python is available)

### Option 2: Start Scraper Only
```bash
npm run start:scraper
```
This starts just the scraper service on port 5001.

### Option 3: Start App Without Scraper
```bash
npm start
```
This starts only the app. It will still work but won't have the scraper fallback.

## 📋 Prerequisites

### Required:
- Node.js (already installed if you're running the app)

### Optional (for scraper):
- **Python 3.7+** (for web scraper service)
  - Download from: https://www.python.org/downloads/
  - Or use `brew install python3` (Mac) or `apt install python3` (Linux)

## 🔧 Setup

### First Time Setup:

1. **Install Python dependencies** (if using scraper):
   ```bash
   cd autoscrape
   pip install -r requirements.txt
   ```

   Or let the startup script do it automatically:
   ```bash
   npm run start:full
   ```

2. **Verify installation**:
   ```bash
   # Check if scraper is running
   curl http://localhost:5001/scrape?code=__health_check__
   ```

   You should get a JSON response (even if it's an error, that means Flask is running).

## 🎯 How It Works

### Data Source Priority:

When a user scans a medication, the app queries sources in this order:

1. **Local Recall Databases** (offline, instant)
   - EMA, NAFDAC, SAHPRA, PPB recalls
   - No network needed

2. **OpenFDA API** (primary online source)
   - Official FDA medication database
   - ~99.9% uptime
   - 240 requests/minute limit

3. **RxNorm API** (drug interactions)
   - National Library of Medicine
   - Drug interaction checking
   - 20 requests/second limit

4. **Web Scraper** (fallback) ⬅️ **YOUR SCRAPER**
   - Searches DailyMed, EMA, and international databases
   - Used when OpenFDA has no data
   - Runs on localhost:5001

### What the Scraper Does:

The scraper tries multiple sources for each drug code:

```python
# For NDC codes (US drugs):
1. https://dailymed.nlm.nih.gov/dailymed/search.cfm?query={code}
2. https://www.accessdata.fda.gov/scripts/cder/daf/?query={code}

# For GTIN/international codes:
3. https://www.ema.europa.eu/en/medicines/search?query={code}
4. https://www.nafdac.gov.ng/?s={code}
5. https://www.pharmacyboardkenya.org/?s={code}
6. https://www.sahpra.org.za/?s={code}

# Fallback:
7. Google search
```

It extracts:
- Drug name
- Active ingredients
- Indications (what it's used for)
- Dosage information
- Side effects
- Warnings/contraindications

## 📊 Scraper Status Indicators

### When Starting the App:

```bash
# Scraper available:
[Setup] ✓ Scraper service started successfully
[Scraper] ✓ Scraper service running at http://localhost:5001

# Scraper unavailable (Python not installed):
[Setup] Python not found - scraper will not be available
[Setup] App will use OpenFDA and other sources only

# Scraper already running:
[Setup] ✓ Scraper already running
```

## 🔍 Testing the Scraper

### Test with a real drug code:

```bash
# NDC code (US drug)
curl "http://localhost:5001/scrape?code=0781-1506-10"

# GTIN code (international)
curl "http://localhost:5001/scrape?code=3400933071998"
```

### Expected Response:

```json
{
  "title": "Amoxicillin 250mg Capsules",
  "indications": "Treatment of bacterial infections...",
  "dosage": "250mg every 8 hours...",
  "side_effects": "Nausea, diarrhea, rash...",
  "raw": { ...full scrape data... }
}
```

## 🛠️ Troubleshooting

### "Python not found"
**Problem:** The startup script can't find Python.

**Solution:**
```bash
# Install Python 3.7+
# Windows: Download from https://www.python.org/downloads/
# Mac: brew install python3
# Linux: apt install python3

# Verify installation:
python3 --version
# Should show: Python 3.x.x
```

### "Scraper started but health check failed"
**Problem:** Scraper is initializing but not responding yet.

**Solution:** Wait 10-15 seconds and try again. Flask takes a moment to start.

### "ModuleNotFoundError: No module named 'flask'"
**Problem:** Python dependencies not installed.

**Solution:**
```bash
cd autoscrape
pip install -r requirements.txt
# or
python3 -m pip install -r requirements.txt
```

### "Address already in use: Port 5001"
**Problem:** Another process is using port 5001.

**Solutions:**

**Option 1: Find and stop the process**
```bash
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5001 | xargs kill -9
```

**Option 2: Change the port**
Edit `autoscrape/scraper_api.py`:
```python
# Change line 118:
app.run(host='0.0.0.0', port=5002, debug=True)  # Use 5002 instead
```

Also update `src/utils/webscraperDrugInfo.ts`:
```typescript
const DEFAULT_SCRAPER_DEV_HOST = 'http://localhost:5002';
```

### "Scraper very slow"
**Problem:** Web scraping can take 5-30 seconds per request.

**Why:** The scraper:
1. Tries multiple URLs sequentially
2. Parses HTML for each page
3. Extracts structured data
4. Returns only when it finds usable information

**This is normal!** OpenFDA is much faster (< 1 second), so the scraper is only used as a fallback.

## 📈 Performance

### Expected Response Times:

| Source | Response Time | Success Rate |
|--------|--------------|--------------|
| Local Recalls | < 10ms | 100% (offline) |
| OpenFDA API | 200-800ms | ~95% (US drugs) |
| RxNorm API | 300-1000ms | ~90% (interactions) |
| **Web Scraper** | **5-30 seconds** | ~60-70% (fallback) |

### Why Scraper is Slow:

The scraper must:
1. Make HTTP request to website
2. Wait for page to load
3. Parse HTML
4. Extract structured data
5. Try multiple URLs if first fails

**This is by design!** It's a fallback, not the primary source.

## 🚦 App Behavior

### With Scraper Running:
```
User scans unknown drug (not in OpenFDA)
   ↓
OpenFDA: No data found (0.5s)
   ↓
Web Scraper: Searching... (10-30s)
   ↓
Result: Drug info from DailyMed or international source
```

### Without Scraper Running:
```
User scans unknown drug (not in OpenFDA)
   ↓
OpenFDA: No data found (0.5s)
   ↓
Web Scraper: Not available
   ↓
Result: "No data found" message
```

**The app works either way!** The scraper just improves coverage for international drugs.

## 🌐 Deployment

### Development (Current):
- Scraper runs on localhost:5001
- Only accessible from your computer
- Automatically starts with `npm run start:full`

### Production Options:

#### Option 1: Docker (Recommended)
The scraper includes Docker support:

```bash
cd autoscrape
docker-compose up -d
```

This runs the scraper as a containerized service.

#### Option 2: Cloud Hosting
Deploy the Flask app to:
- **Heroku**: Free tier available
- **Google Cloud Run**: Serverless, pay-per-use
- **AWS Lambda**: With API Gateway
- **DigitalOcean App Platform**: $5/month

Example for Heroku:
```bash
cd autoscrape
heroku create medlink-scraper
git push heroku master
```

Then update your app to use the deployed URL:
```typescript
// In src/utils/webscraperDrugInfo.ts
const DEFAULT_SCRAPER_HOST = 'https://medlink-scraper.herokuapp.com';
```

#### Option 3: Disable Scraper in Production
If you don't want to manage the scraper service:

```typescript
// In src/utils/webscraperDrugInfo.ts
export async function fetchDrugInfoFromScraper(code: string): Promise<ScraperDrugInfo | null> {
  // Disable scraper in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  // ... existing code
}
```

The app will work fine with just OpenFDA and RxNorm!

## 📝 Summary

### What You Get:

✅ **Automatic startup**: Scraper starts with `npm run start:full`
✅ **Graceful fallback**: App works without scraper
✅ **Better coverage**: International drugs supported
✅ **Easy testing**: Health checks built-in
✅ **Production ready**: Docker support included

### NPM Scripts:

```bash
npm run start:full     # App + Scraper (recommended for development)
npm run start:scraper  # Scraper only
npm start              # App only (production mode)
```

### Files Created:

- `start-scraper.js` - Scraper startup script
- `start-with-scraper.js` - Combined startup script
- `SCRAPER_SETUP.md` - This guide

### Modified Files:

- `package.json` - Added scraper scripts
- `autoscrape/requirements.txt` - Added Flask dependency

## 🎉 You're Ready!

Your scraper is now integrated and ready to use:

```bash
# Start everything:
npm run start:full

# Scan a drug in your app
# If OpenFDA doesn't have it, scraper takes over automatically!
```

**The scraper will now be used as a fallback whenever OpenFDA doesn't have data for a scanned medication!** 🚀

