
# Shabbos Candle Lighting Bot
 
> A simple GroupMe bot that posts candle lighting times every Friday so your group always knows what time Shabbos is.
 
Built with Google Apps Script. Pulls times from the [Hebcal API](https://www.hebcal.com) — 18 minutes before sunset by default. No server needed, runs entirely in your Google account for free.
 
---
 
## Features
 
- Posts candle lighting time to any GroupMe chat every Friday at noon
- Defaults to New York City — one line to change to any US or international city
- `testBot()` lets you preview the message in the logs before it goes live
- Adjustable candle lighting offset (18 min standard, change to 20/22/etc)
---
 
## Setup
 
1. Go to [script.google.com](https://script.google.com) and create a new project
2. Paste the code into `Code.gs`
3. Fill in your `BOT_ID` in the `CONFIG` block at the top
4. Run `setupTrigger()` once manually to schedule the Friday noon post
5. Done
<details>
<summary>Code.gs</summary>
<pre><code>
// ============================================================
//  SHABBAT CANDLE LIGHTING BOT
//  Posts candle lighting time every Friday at noon to GroupMe
//
//  SETUP:
//  1. Paste into Google Apps Script (script.google.com)
//  2. Fill in CONFIG below
//  3. Run setupTrigger() ONCE to schedule the Friday noon post
//
//  TO CHANGE CITY: update ZIP, CITY_NAME, and TIMEZONE
// ============================================================
 
const CONFIG = {
 
  // --- GroupMe ---
  BOT_ID: "YOUR_BOT_ID_HERE",
 
  // --- Location (default: New York City) ---
  // Swap ZIP + CITY_NAME + TIMEZONE to change city
  // Examples:
  //   NYC:         10001  /  New York City    /  America/New_York
  //   Monticello:  12701  /  Monticello       /  America/New_York
  //   Brooklyn:    11201  /  Brooklyn         /  America/New_York
  //   Lakewood NJ: 08701  /  Lakewood         /  America/New_York
  //   Miami:       33101  /  Miami            /  America/New_York
  //   Chicago:     60601  /  Chicago          /  America/Chicago
  //   Los Angeles: 90001  /  Los Angeles      /  America/Los_Angeles
  ZIP:       "10001",
  CITY_NAME: "New York City",
  TIMEZONE:  "America/New_York",
 
  // --- Candle lighting offset ---
  MINUTES_BEFORE_SUNSET: 18,
};
 
// ============================================================
//  MAIN
// ============================================================
function postCandleLightingTime() {
  try {
    const data = fetchShabbatTimes();
    if (!data || !data.candleLighting) {
      Logger.log("No candle lighting time returned from Hebcal.");
      return;
    }
    const message = "Candle lighting in " + CONFIG.CITY_NAME + ": " + data.candleLighting;
    sendGroupMeMessage(message);
  } catch (e) {
    Logger.log("Error: " + e.message);
  }
}
 
// ============================================================
//  TEST  -  logs the message to Apps Script chat, does NOT post
// ============================================================
function testBot() {
  try {
    const data = fetchShabbatTimes();
    if (!data || !data.candleLighting) {
      Logger.log("No candle lighting time returned from Hebcal.");
      return;
    }
    const message = "Candle lighting in " + CONFIG.CITY_NAME + ": " + data.candleLighting;
    Logger.log("TEST (not posted): " + message);
  } catch (e) {
    Logger.log("Error: " + e.message);
  }
}
 
// ============================================================
//  HEBCAL API
// ============================================================
function fetchShabbatTimes() {
  const url =
    "https://www.hebcal.com/shabbat?cfg=json" +
    "&amp;geo=zip&amp;zip=" + CONFIG.ZIP +
    "&amp;b=" + CONFIG.MINUTES_BEFORE_SUNSET +
    "&amp;lg=s";
 
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
 
  if (response.getResponseCode() !== 200) {
    Logger.log("Hebcal API error: " + response.getResponseCode());
    return null;
  }
 
  const json = JSON.parse(response.getContentText());
  const result = { candleLighting: null };
 
  for (const item of (json.items || [])) {
    if (item.category === "candles") {
      result.candleLighting = formatTime(item.date);
    }
  }
 
  return result;
}
 
// ============================================================
//  TIME FORMATTING
// ============================================================
function formatTime(isoDateString) {
  const d = new Date(isoDateString);
  return Utilities.formatDate(d, CONFIG.TIMEZONE, "h:mm a");
}
 
// ============================================================
//  GROUPME
// ============================================================
function sendGroupMeMessage(text) {
  const payload = JSON.stringify({ bot_id: CONFIG.BOT_ID, text: text });
  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch("https://api.groupme.com/v3/bots/post", options);
  Logger.log("GroupMe response: " + response.getResponseCode());
}
 
// ============================================================
//  TRIGGER SETUP  -  run this function ONCE manually
// ============================================================
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === "postCandleLightingTime") {
      ScriptApp.deleteTrigger(t);
    }
  }
  ScriptApp.newTrigger("postCandleLightingTime")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(12)
    .create();
  Logger.log("Trigger set: fires every Friday at noon.");
}
</code></pre>
</details>
> Don't have a GroupMe bot yet? Create one at (https://dev.groupme.com/bots)
 
---
 
## Configuration
 
All settings live at the top of `Code.gs` in the `CONFIG` object:
 
```js
const CONFIG = {
  BOT_ID:                "YOUR_BOT_ID_HERE",
  ZIP:                   "10001",
  CITY_NAME:             "New York City",
  TIMEZONE:              "America/New_York",
  MINUTES_BEFORE_SUNSET: 18,
};
```
 
| Field | Default | Description |
|---|---|---|
| `BOT_ID` | — | GroupMe bot ID |
| `ZIP` | `10001` | US zip code for your city |
| `CITY_NAME` | `New York City` | Display name in the posted message |
| `TIMEZONE` | `America/New_York` | IANA timezone string |
| `MINUTES_BEFORE_SUNSET` | `18` | Candle lighting offset |
 
---
 
## Changing the City
 
### US Cities
 
Swap `ZIP`, `CITY_NAME`, and `TIMEZONE`:
 
```js
ZIP:       "10952",
CITY_NAME: "Monsey",
TIMEZONE:  "America/New_York",
```
 
| City | ZIP | Timezone |
|---|---|---|
| New York City | 10001 | America/New_York |
| Brooklyn, NY | 11201 | America/New_York |
| Monsey, NY | 10952 | America/New_York |
| Monticello, NY | 12701 | America/New_York |
| Lakewood, NJ | 08701 | America/New_York |
| Passaic, NJ | 07055 | America/New_York |
| Baltimore, MD | 21201 | America/New_York |
| Boca Raton, FL | 33431 | America/New_York |
| Chicago, IL | 60601 | America/Chicago |
| Los Angeles, CA | 90001 | America/Los_Angeles |
 
### International Cities
 
For non-US cities, replace `ZIP` with `GEONAME_ID` in `CONFIG` and update the API line in `fetchShabbatTimes()`:
 
```js
// change this:
"&geo=zip&zip=" + CONFIG.ZIP +
 
// to this:
"&geo=geoname&geonameid=" + CONFIG.GEONAME_ID +
```
 
| City | Geoname ID | Timezone |
|---|---|---|
| London, UK | 2643743 | Europe/London |
| Toronto, Canada | 6167865 | America/Toronto |
| Montreal, Canada | 6077243 | America/Toronto |
| Jerusalem, Israel | 281184 | Asia/Jerusalem |
| Tel Aviv, Israel | 293397 | Asia/Jerusalem |
| Antwerp, Belgium | 2803138 | Europe/Brussels |
| Buenos Aires, Argentina | 3435910 | America/Argentina/Buenos_Aires |
 
Find any city's geoname ID at [geonames.org](https://www.geonames.org).
 
---
 
## Functions
 
| Function | Description |
|---|---|
| `postCandleLightingTime()` | Fetches the time and posts to GroupMe — called automatically by the trigger |
| `testBot()` | Fetches the time and logs it to the Apps Script console — does **not** post |
| `setupTrigger()` | Schedules the bot to run every Friday at noon — run once |
 
---
 
## Sample Output
 
```
Candle lighting in New York City: 7:52 pm
```
 
---
 
## Stack
 
- [Google Apps Script](https://script.google.com)
- [Hebcal API](https://www.hebcal.com/home/developer-apis)
- [GroupMe Bots API](https://dev.groupme.com/docs/v3#bots)
