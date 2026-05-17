// engine.js - Expressive Weather Platform Sandboxed Processing Core

// ABSOLUTELY HARDCODED SAFE FALLBACK DEFAULT FOCUS - MIAMI, FLORIDA
let vectorLat = 25.76;
let vectorLon = -80.19;
let currentZoneName = "Miami, Florida";

document.addEventListener("DOMContentLoaded", () => {
    executeClockEngine();
    setInterval(executeClockEngine, 1000);
    
    // Auto-engage baseline metrics targeting the Miami matrix block immediately without checking local client telemetry
    engageTelemetryPipelines();
    
    // Set 5-minute telemetry loop refresh timers
    setInterval(refreshSystemDataAssets, 300000);
});

function executeClockEngine() {
    const now = new Date();
    document.getElementById("clock").innerText = now.toUTCString().replace("GMT", "UTC");
}

// Exception Logger Module Display Handler
function reportSystemException(faultOrigin, exceptionMessage) {
    const consoleBox = document.getElementById("system-fault-logger");
    const timestamp = new Date().toLocaleTimeString();
    
    if (consoleBox.innerText.includes("No unexpected execution faults")) {
        consoleBox.innerText = "";
    }
    
    consoleBox.innerText += `[LOG ANOMALY // ${timestamp}] SOURCE: ${faultOrigin.toUpperCase()} -> ${exceptionMessage}\n`;
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Multi-Tab Layout Navigation Handler Toggle
function switchVectorPane(targetPaneId) {
    const views = document.querySelectorAll('.vector-view-pane');
    views.forEach(v => v.classList.remove('active-view'));
    
    const tabs = document.querySelectorAll('.vector-tab');
    tabs.forEach(t => t.classList.remove('active-tab'));
    
    document.getElementById(targetPaneId).classList.add('active-view');
    event.currentTarget.classList.add('active-tab');
}

// Secure Geocoding Parser Engine Interface - Zero IP / Hardware Extraction Footprint
async function executeCitySearchIngest() {
    const searchVal = document.getElementById("city-search-field").value.trim();
    if (!searchVal) {
        reportSystemException("UI Search Form Input", "Submission rejected: String parameters remain blank.");
        return;
    }
    
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchVal)}&count=1&language=en&format=json`;
        const response = await fetch(geoUrl);
        if (!response.ok) throw new Error(`Geocoding server rejected connection state: ${response.status}`);
        
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            reportSystemException("Geocoding Core Resolution", `Zero spatial parameters returned matching string: "${searchVal}"`);
            alert("Location text could not be mapped into spatial vectors. Try again.");
            return;
        }
        
        const targetSector = data.results[0];
        vectorLat = parseFloat(targetSector.latitude).toFixed(2);
        vectorLon = parseFloat(targetSector.longitude).toFixed(2);
        
        // Assemble clean regional identity display string
        const regionLabel = targetSector.admin1 ? `, ${targetSector.admin1}` : "";
        const countryLabel = targetSector.country_code ? ` [${targetSector.country_code.toUpperCase()}]` : "";
        currentZoneName = `${targetSector.name}${regionLabel}${countryLabel}`;
        
        // Clear search line safely
        document.getElementById("city-search-field").value = "";
        
        // Push newly acquired spatial markers through core processing arrays
        engageTelemetryPipelines();
        
    } catch (err) {
        reportSystemException("Geocoding Location Pipeline", err.message);
    }
}

function engageTelemetryPipelines() {
    document.getElementById("vector-location-title").innerText = `${currentZoneName.toUpperCase()} MATRIX // [${vectorLat}°N, ${vectorLon}°W]`;
    
    // Safe asynchronous redirection cascades
    resolveLocalNWSRidgeStationCode();
    fetchOpenMeteoTelemetry();
    fetchNWSLiveAdvisories();
    fetchSPCConvectiveDiscussionRSS();
}

function refreshSystemDataAssets() {
    const cb = new Date().getTime();
    document.getElementById("v-spc-map").src = "https://www.spc.noaa.gov/products/outlook/day1otlk.gif?cb=" + cb;
    engageTelemetryPipelines();
}

// Maps Search Grid coordinates to lock nearby NWS Nexrad identifiers for RIDGE overlays
async function resolveLocalNWSRidgeStationCode() {
    try {
        const res = await fetch(`https://api.weather.gov/points/${vectorLat},${vectorLon}`);
        if (!res.ok) throw new Error(`HTTP NWS Core Fault Flag: ${res.status}`);
        const data = await res.json();
        
        const radarStation = data.properties.radarStation.toLowerCase();
        document.getElementById("nws-ridge-radar").src = `https://radar.weather.gov/ridge/standard/${radarStation.toUpperCase()}_LOOP.gif`;
        
    } catch(err) {
        reportSystemException("NWS Radar Mapping Intercept", `${err.message} - Reverting radar stream frame safely to global CONUS projection loop layout.`);
        document.getElementById("nws-ridge-radar").src = "https://radar.weather.gov/ridge/standard/CONUS_LOOP.gif";
    }
}

// Open-Meteo Synoptic Forecast & Live Observation Processing Framework
async function fetchOpenMeteoTelemetry() {
    try {
        const queryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${vectorLat}&longitude=${vectorLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,dew_point_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timeformat=unixtime&timezone=auto`;
        const res = await fetch(queryUrl);
        if (!res.ok) throw new Error(`Data transport channel reported exception: ${res.status}`);
        const data = await res.json();
        
        // Feed View Pane 1 Conditions Card
        const cur = data.current;
        document.getElementById("vector-temp-out").innerText = `${Math.round(cur.temperature_2m)}°F`;
        document.getElementById("vector-humidity-txt").innerText = `${cur.relative_humidity_2m}%`;
        document.getElementById("vector-wind-txt").innerText = `${Math.round(cur.wind_speed_10m)} MPH`;
        document.getElementById("vector-pressure-txt").innerText = `${(cur.pressure_msl * 0.02953).toFixed(2)}`;
        
        const dewCalc = Math.round(cur.temperature_2m - ((100 - cur.relative_humidity_2m) / 5));
        document.getElementById("vector-dew-txt").innerText = `${dewCalc}°F`;
        
        processWmoCodeToVectorIcon(cur.weather_code, "vector-flowers-icon", "vector-cond-txt");
        
        // Feed View Pane 4 Environmental Matrix Fields
        document.getElementById("v-env-apparent").innerText = `${Math.round(cur.apparent_temperature)}°F`;
        document.getElementById("v-env-precip").innerText = `${cur.precipitation} IN`;
        document.getElementById("v-env-gusts").innerText = `${Math.round(cur.wind_gusts_10m)} MPH`;
        document.getElementById("v-env-clouds").innerText = `${data.hourly.precipitation_probability[0] || 0}%`;
        
        // Dynamically build extended output data maps arrays
        build7DayVectorMatrix(data.daily);
        build72HourVectorMatrix(data.hourly);
        
    } catch(err) {
        reportSystemException("Open-Meteo Ingest Pipeline", err.message);
    }
}

function processWmoCodeToVectorIcon(code, targetSvgId, targetTextId) {
    const icon = document.getElementById(targetSvgId);
    const txt = document.getElementById(targetTextId);
    
    icon.className = "wi vector-weather-icon ";
    
    const wmoMap = {
        0: { cls: "wi-day-sunny", txt: "CLEAR SYNCED" },
        1: { cls: "wi-day-cloudy", txt: "PARTIAL SCATTER" },
        2: { cls: "wi-day-cloudy", txt: "INTERMITTENT VEIL" },
        3: { cls: "wi-cloudy", txt: "STRATIFIED OVERCAST" },
        45: { cls: "wi-fog", txt: "RADIAL FOG INVERSION" },
        48: { cls: "wi-fog", txt: "DEPOSITED RECON FOG" },
        51: { cls: "wi-sprinkle", txt: "STABLE DRIZZLE VECTORS" },
        53: { cls: "wi-sprinkle", txt: "MODERATE DRIZZLE MATRIX" },
        55: { cls: "wi-sprinkle", txt: "SATURATED HEAVY DRIZZLE" },
        61: { cls: "wi-rain", txt: "PRECIPITATION VECTORS ACTIVE" },
        63: { cls: "wi-rain", txt: "MODERATE RAIN FRONTS" },
        65: { cls: "wi-rain-wind", txt: "CONVECTIVE DOWNPOUR CELL" },
        71: { cls: "wi-snow", txt: "CRYSTALLINE SCATTER" },
        73: { cls: "wi-snow", txt: "MODERATE SNOW ACCUM" },
        75: { cls: "wi-snow-wind", txt: "MAJOR WINTER STRUCT" },
        80: { cls: "wi-showers", txt: "UNSTABLE SHOWER CLUSTERS" },
        81: { cls: "wi-showers", txt: "CYCLIC SHOWER CORRIDOR" },
        82: { cls: "wi-thunderstorm", txt: "INTENSE CONVECTIVE ASCENT" },
        95: { cls: "wi-thunderstorm", txt: "ELECTRICAL DISCHARGE SHIELDS" },
        96: { cls: "wi-storm-showers", txt: "SEVERE CELL CELL IGNITION" },
        99: { cls: "wi-lightning", txt: "HIGH-END MESOSCALE OUTBREAK" }
    };
    
    const lookup = wmoMap[code] || { cls: "wi-na", txt: "UNRESOLVED WMO FAULT" };
    icon.classList.add(lookup.cls);
    if (txt) txt.innerText = lookup.txt;
    
    return lookup;
}

function build7DayVectorMatrix(daily) {
    const tableBody = document.getElementById("v-extended-table").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";
    
    for (let i = 0; i < daily.time.length; i++) {
        const d = new Date(daily.time[i] * 1000);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        
        const r = tableBody.insertRow();
        r.insertCell(0).innerText = dayLabel;
        
        const iconCell = r.insertCell(1);
        const iconElement = document.createElement("i");
        iconElement.className = "wi ";
        const wmoData = processWmoCodeToVectorIcon(daily.weather_code[i], "vector-flowers-icon", null);
        iconElement.classList.add(wmoData.cls);
        iconElement.style.color = "var(--vector-teal)";
        iconCell.appendChild(iconElement);
        
        r.insertCell(2).innerText = `${Math.round(daily.temperature_2m_max[i])}°F`;
        r.insertCell(3).innerText = `${Math.round(daily.temperature_2m_min[i])}°F`;
        r.insertCell(4).innerText = `${daily.precipitation_probability_max[i]}%`;
    }
}

function build72HourVectorMatrix(hourly) {
    const tableBody = document.getElementById("v-hourly-table").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";
    
    const cap = Math.min(hourly.time.length, 72);
    for (let i = 0; i < cap; i++) {
        const d = new Date(hourly.time[i] * 1000);
        const timeLabel = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) + " " + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const r = tableBody.insertRow();
        r.insertCell(0).innerText = timeLabel;
        
        const iconCell = r.insertCell(1);
        const iconElement = document.createElement("i");
        iconElement.className = "wi ";
        const wmoData = processWmoCodeToVectorIcon(hourly.weather_code[i], "vector-flowers-icon", null);
        iconElement.classList.add(wmoData.cls);
        iconCell.appendChild(iconElement);
        
        r.insertCell(2).innerText = `${Math.round(hourly.temperature_2m[i])}°F`;
        r.insertCell(3).innerText = `${Math.round(hourly.dew_point_2m[i])}°F`;
        r.insertCell(4).innerText = `${Math.round(hourly.wind_speed_10m[i])} MPH`;
        r.insertCell(5).innerText = `${hourly.precipitation_probability[i]}%`;
    }
}

// National Weather Service Live Advisory Wire Ingest Parsing Module
async function fetchNWSLiveAdvisories() {
    const terminal = document.getElementById("vector-nws-terminal");
    const banner = document.getElementById("alert-banner");
    
    try {
        const resPoint = await fetch(`https://api.weather.gov/points/${vectorLat},${vectorLon}`);
        if (!resPoint.ok) throw new Error(`Target location falls outside standard NWS tracking margins: ${resPoint.status}`);
        const pData = await resPoint.json();
        
        const zoneId = pData.properties.county.split('/').pop();
        
        const resAlerts = await fetch(`https://api.weather.gov/alerts/active/zone/${zoneId}`);
        if (!resAlerts.ok) throw new Error(`Active notification layer connection drop: ${resAlerts.status}`);
        const aData = await resAlerts.json();
        
        if (aData.features && aData.features.length > 0) {
            let logBlocks = "";
            let coreCriticalWarnPresent = false;
            
            aData.features.forEach(f => {
                const h = f.properties.headline;
                const d = f.properties.description;
                logBlocks += `>>> INGESTED INCIDENT REPORT RECORD ENCOUNTERED\nIDENTIFIER: ${h}\n\n${d}\n\n=========================================\n\n`;
                
                if (d.toUpperCase().includes("TORNADO") || d.toUpperCase().includes("PARTICULARLY DANGEROUS SITUATION") || d.toUpperCase().includes("SEVERE THUNDERSTORM WARNING")) {
                    coreCriticalWarnPresent = true;
                }
            });
            
            terminal.innerText = logBlocks;
            
            if (coreCriticalWarnPresent) {
                banner.style.display = "block";
                banner.innerText = "🚨 EXTREME WEATHER WARNING: SEVERE HAZARD VECTORS DETECTED IN LOCAL SUBGRID CELL";
                banner.style.background = "linear-gradient(90deg, rgba(255,0,0,0.1) 0%, rgba(255,0,0,0.7) 50%, rgba(255,0,0,0.1) 100%)";
            } else {
                banner.style.display = "block";
                banner.innerText = "REGIONAL ADVISORIES OR METEOROLOGICAL DISCREPANCIES RECORDED";
                banner.style.background = "linear-gradient(90deg, rgba(255,189,0,0.1) 0%, rgba(255,189,0,0.7) 50%, rgba(255,189,0,0.1) 100%)";
            }
        } else {
            terminal.innerText = "NO ACTIVE SEVERE BULLETINS DISCOVERED WITHIN THE SCOPE OF THE CHOSEN GEOSPATIAL VECTOR AREA.";
            banner.style.display = "none";
        }
        
    } catch(err) {
        reportSystemException("National Weather Service API Wire", err.message);
        terminal.innerText = `[NWS TARGET STALL] Target location coordinates are either located outside NWS territorial observation bounds, or the core endpoint returned an array fault.`;
        banner.style.display = "none";
    }
}

// Storm Prediction Center Mesoscale Discussions XML RSS Scraper Pipeline Engine
async function fetchSPCConvectiveDiscussionRSS() {
    const box = document.getElementById("v-spc-md-feed");
    
    try {
        const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.spc.noaa.gov/products/md/md-rss.xml");
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`XML Feed CORS Relay handshake degraded: ${res.status}`);
        const data = await res.json();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "text/xml");
        const entries = xml.getElementsByTagName("item");
        
        if (entries.length === 0) {
            box.innerText = "NO ACTIVE CONVECTIVE MESOSCALE DISCUSSIONS DETECTED BY THE STORM PREDICTION CENTER NATIONWIDE.";
            return;
        }
        
        let compiledHtml = "";
        for (let i = 0; i < Math.min(entries.length, 12); i++) {
            const title = entries[i].getElementsByTagName("title")[0].textContent;
            const link = entries[i].getElementsByTagName("link")[0].textContent;
            const desc = entries[i].getElementsByTagName("description")[0].textContent;
            
            compiledHtml += `
                <div class="md-discussion-node">
                    <a href="${link}" target="_blank">⚡ ${title}</a>
                    <p style="margin:6px 0 0 0; font-size:0.8rem; color:var(--text-secondary); font-family:sans-serif;">${desc}</p>
                </div>
            `;
        }
        box.innerHTML = compiledHtml;
        
    } catch(err) {
        reportSystemException("SPC Convective RSS Threader", err.message);
        box.innerText = `[SPC DISCONNECT ERROR] Network connection refused. Failed to translate core XML structural objects.`;
    }
}
