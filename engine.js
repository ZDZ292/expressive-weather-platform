// engine.js - Expressive Weather Platform Processing Core

let currentLat = null;
let currentLon = null;

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Attempt system geolocation verification naturally upon initialization
    detectLocation();
    
    // Setup background automated polling loops (5-minute refresh cycles)
    setInterval(refreshDataPipelines, 300000);
});

function updateClock() {
    const now = new Date();
    const utcString = now.toUTCString().replace("GMT", "UTC");
    document.getElementById("clock").innerText = utcString;
}

// Vintage 2000s Navigation Tabs Switching Logic
function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Automated System Location Capture Pipeline
function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude.toFixed(2);
                currentLon = position.coords.longitude.toFixed(2);
                document.getElementById("loc-prompt").style.display = "none";
                executeDataFetchChain();
            },
            (error) => {
                console.log("Geolocation entry denied/timed out. Switching to manual intercept prompt.");
                document.getElementById("station-display").innerText = "AWAITING LAT/LON TARGET VECTOR INPUT";
            }
        );
    }
}

function initManualLocation() {
    const input = document.getElementById("manual-coords").value;
    const coords = input.split(",");
    if (coords.length === 2) {
        currentLat = parseFloat(coords[0]).toFixed(2);
        currentLon = parseFloat(coords[1]).toFixed(2);
        document.getElementById("loc-prompt").style.display = "none";
        executeDataFetchChain();
    } else {
        alert("Invalid format array. Provide coordinates parsed as: Lat, Lon");
    }
}

// Central Data Processing Switchboard
function executeDataFetchChain() {
    if (!currentLat || !currentLon) return;
    
    document.getElementById("coord-txt").innerText = `${currentLat}, ${currentLon}`;
    document.getElementById("station-display").innerText = `REGION TARGET: METRO GRID [${currentLat}N, ${currentLon}W]`;
    
    fetchOpenMeteoConditions();
    fetchNWSZoneAlerts();
}

function refreshDataPipelines() {
    const timestamp = new Date().getTime();
    
    // Break caches on overwritten images
    document.getElementById("spc-outlook").src = "https://www.spc.noaa.gov/products/outlook/day1otlk.gif?t=" + timestamp;
    document.getElementById("meso-sector").src = "https://www.spc.noaa.gov/exper/mesoanalysis/s11/sbcape.gif?t=" + timestamp;
    
    executeDataFetchChain();
}

// 1. Open-Meteo Dynamic Weather Conditions Ingest
async function fetchOpenMeteoConditions() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Meteo telemetry link degraded.");
        const data = await response.json();
        
        const current = data.current;
        document.getElementById("current-temp").innerText = `${Math.round(current.temperature_2m)}°F`;
        document.getElementById("humidity-txt").innerText = `${current.relative_humidity_2m}%`;
        document.getElementById("wind-txt").innerText = `${Math.round(current.wind_speed_10m)} MPH`;
        
        mapWmoCodeToErikFlowersIcon(current.weather_code);
        
    } catch (error) {
        console.error("Conditions Pipeline Stall: ", error);
        document.getElementById("condition-txt").innerText = "TELEMETRY TIMEOUT";
    }
}

// WMO Code translator matching Open-Meteo specs directly into Erik Flowers weather-icons variables
function mapWmoCodeToErikFlowersIcon(code) {
    const iconElement = document.getElementById("condition-icon");
    const txtElement = document.getElementById("condition-txt");
    
    // Reset core class structures
    iconElement.className = "wi twc-icon ";
    
    // Explicit Weather Channel analog translations
    if (code === 0) {
        iconElement.classList.add("wi-day-sunny");
        txtElement.innerText = "CLEAR SKIES";
    } else if ([1, 2, 3].includes(code)) {
        iconElement.classList.add("wi-day-cloudy");
        txtElement.innerText = "PARTLY CLOUDY";
    } else if ([45, 48].includes(code)) {
        iconElement.classList.add("wi-fog");
        txtElement.innerText = "AMB FOG BOUND";
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
        iconElement.classList.add("wi-rain");
        txtElement.innerText = "ACTIVE SHOWERS";
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
        iconElement.classList.add("wi-snow");
        txtElement.innerText = "CONVECTIVE SNOW";
    } else if ([95, 96, 99].includes(code)) {
        iconElement.classList.add("wi-thunderstorm");
        txtElement.innerText = "SEVERE T-STORMS";
    } else {
        iconElement.classList.add("wi-na");
        txtElement.innerText = "UNCLASSIFIED UNKN";
    }
}

// 2. Real-Time National Weather Service Severe Intercept Scraper
async function fetchNWSZoneAlerts() {
    const terminal = document.getElementById("nws-terminal");
    const banner = document.getElementById("alert-banner");
    
    try {
        // Step A: Convert raw lat/lon markers into NWS zone footprints completely free
        const pointResponse = await fetch(`https://api.weather.gov/points/${currentLat},${currentLon}`);
        if (!pointResponse.ok) throw new Error("NWS geographical resolution vector fault.");
        const pointData = await pointResponse.json();
        
        // Extract raw county warning zone parameters
        const countyZoneUrl = pointData.properties.county;
        const zoneId = countyZoneUrl.split('/').pop(); 
        
        // Step B: Query active alert criteria strings for the target grid footprint
        const alertResponse = await fetch(`https://api.weather.gov/alerts/active/zone/${zoneId}`);
        if (!alertResponse.ok) throw new Error("NWS text database timeout.");
        const alertData = await alertResponse.json();
        
        if (alertData.features && alertData.features.length > 0) {
            let compiledAlerts = "";
            let extremeHazardPresent = false;
            
            alertData.features.forEach(alert => {
                const headline = alert.properties.headline;
                const description = alert.properties.description;
                compiledAlerts += `[!] ACTIVE HAZARD BULLETIN INITIALIZED\nHEADLINE: ${headline}\n\n${description}\n\n=========================================\n\n`;
                
                // Track signature high-end phrasing parameters
                if (description.toUpperCase().includes("PARTICULARLY DANGEROUS SITUATION") || 
                    description.toUpperCase().includes("TORNADO EMERGENCY") ||
                    description.toUpperCase().includes("TORNADO WARNING")) {
                    extremeHazardPresent = true;
                }
            });
            
            terminal.innerText = compiledAlerts;
            
            if (extremeHazardPresent) {
                banner.style.display = "block";
                banner.innerText = "🚨 HIGH-END MESOSCALE CRITICAL HAZARD ACTIVE IN VECTOR RADAR GRID";
                banner.style.background = "var(--alert-red)";
            } else {
                banner.style.display = "block";
                banner.innerText = "REGIONAL ADVISORIES OR ACTIVE WATCHES DETECTED BY REGIONAL WEATHER OFFICE";
                banner.style.background = "var(--vintage-gold)";
            }
        } else {
            terminal.innerText = "NO ACTIVE SEVERE WEATHER WARNINGS OR CRITICAL CONVECTIVE WATCHES ENCOUNTERED WITHIN TARGET COUNTY RADAR ZONE FOOTPRINT.";
            banner.style.display = "none";
        }
    } catch (error) {
        terminal.innerText = `[TELEMETRY FAULT] Failed to resolve NWS API string array: ${error.message}\nRe-attempting baseline configuration next system loop cycle...`;
        banner.style.display = "none";
    }
}
