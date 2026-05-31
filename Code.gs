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
//  TEST  –  logs the message to Apps Script chat, does NOT post
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
    "&geo=zip&zip=" + CONFIG.ZIP +
    "&b=" + CONFIG.MINUTES_BEFORE_SUNSET +
    "&lg=s";

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
//  TRIGGER SETUP  –  run this function ONCE manually
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
