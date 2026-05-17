// engine.js - Expressive Weather Platform Processing Core

let targetLat = null;
let targetLon = null;

document.addEventListener("DOMContentLoaded", () => {
    runChronometer();
    setInterval(runChronometer, 1000);
    
    // Fire natural coordinate acquisition
    initializeSystemPosition();
    
    // Schedule automated periodic refreshes (5-minute database poll loops)
    setInterval(refreshSystemDataAssets, 300000);
});

function runChronometer() {
    const now = new Date();
    document.getElementById("clock").innerText = now.toUTCString().replace("GMT", "UTC");
}

// 2000s Controller Deck Panel Switching Routine
function toggleDeckPane(targetPaneId) {
    const panes = document.querySelectorAll('.tab-view');
    panes.forEach(pane => pane.classList.remove('active-view'));
    
    const tabs = document.querySelectorAll('.deck-tab');
    tabs.forEach(tab => tab.classList.remove('active-tab'));
    
    document.getElementById(targetPaneId).classList.add('active-view');
    event.currentTarget.classList.add('active-tab');
}

// Coordinate Capture Automation Sequence
function initializeSystemPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                targetLat = pos.coords.latitude.toFixed(2);
                targetLon = pos.coords.longitude.toFixed(2);
                document.getElementById("init-panel").style.display = "none";
                executeTelemetryPipeline();
            },
            (err) => {
                console.warn("Automated positioning blocked. Halting for user input matrix.");
                document.getElementById("card-location-title").innerText = "AWAITING RADAR FOVEA DEPLOYMENT";
            }
        );
    }
}

function overrideManualCoordinates() {
    const rawVal = document.getElementById("geo-coordinates").value;
    const splitArr = rawVal.split(",");
    if (splitArr.length === 2) {
        targetLat = parseFloat(splitArr[0]).toFixed(2);
        targetLon = parseFloat(splitArr[1]).toFixed(2);
        document.getElementById("init-panel").style.display = "none";
        executeTelemetryPipeline();
    } else {
        alert("Incorrect position syntax. Re-enter matrix parameters as: Lat, Lon");
    }
}

function executeTelemetryPipeline() {
    if (!targetLat || !targetLon) return;
    
    document.getElementById("card-location-title").innerText = `GRID SECTOR: [${targetLat}°N, ${targetLon}°W]`;
    
    // Bind dynamic Windy iFrame Radar Engine completely free using target coordinate markers
    const radarFrame = document.getElementById("radar-widget");
    radarFrame.src = `https://www.windy.com/-Radar-radar?radar,${targetLat},${targetLon},7`;
    
    fetchOpenMeteoTelemetry();
    fetchNationalWeatherServiceAlerts();
    scrapeStormPredictionCenterFeeds();
}

function refreshSystemDataAssets() {
    const cacheBuster = new Date().getTime();
    document.getElementById("spc-outlook-img").src = "https://www.spc.noaa.gov/products/outlook/day1otlk.gif?cb=" + cacheBuster;
    executeTelemetryPipeline();
}

// 1. Open-Meteo Multi-Tier Database Parsing
async function fetchOpenMeteoTelemetry() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,dew_point_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timeformat=unixtime&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Telemetry database non-responsive.");
        const data = await res.json();
        
        // Feed Tab 1: Current IntelliStar Metrics
        const current = data.current;
        document.getElementById("card-temp").innerText = `${Math.round(current.temperature_2m)}°F`;
        document.getElementById("card-humidity-txt").innerText = `${current.relative_humidity_2m}%`;
        document.getElementById("card-wind-txt").innerText = `${Math.round(current.wind_speed_10m)} MPH`;
        document.getElementById("card-pressure-txt").innerText = `${(current.pressure_msl * 0.02953).toFixed(2)}`;
        
        // Extract localized current dewpoint roughly using Magnus-Tetens framework calculation or pulling matching structural indices
        const approximateDew = Math.round(current.temperature_2m - ((100 - current.relative_humidity_2m) / 5));
        document.getElementById("card-dew-txt").innerText = `${approximateDew}°F`;
        
        // Establish Iconographic Class Links
        mapWmoCodeToVintageTWCFont(current.weather_code, "twc-font-icon", "card-cond-txt");
        
        // Feed Tab 4: Current Environmental Arrays
        document.getElementById("env-apparent").innerText = `${Math.round(current.apparent_temperature)}°F`;
        document.getElementById("env-precip").innerText = `${current.precipitation} IN`;
        document.getElementById("env-gusts").innerText = `${Math.round(current.wind_gusts_10m)} MPH`;
        document.getElementById("env-clouds").innerText = `${data.hourly.precipitation_probability[0] || 0}%`; // Proxy cloud thickness from front hourly precipitation trends
        
        // Feed Tab 5: Extended 7-Day Matrix Generation
        buildSevenDayOutlook(data.daily);
        
        // Feed Tab 6: 72-Hour Hourly Stratification
        buildHourlyForecastTable(data.hourly);
        
    } catch (err) {
        console.error("Open-Meteo Pipeline Ingest Error: ", err);
    }
}

// 2. Open-Source Erik Flowers Weather Icons Mapping Engine
function mapWmoCodeToVintageTWCFont(code, imgElementId, txtElementId) {
    const iconNode = document.getElementById(imgElementId);
    const txtNode = document.getElementById(txtElementId);
    
    iconNode.className = "wi twc-icon-frame ";
    
    const wmoMap = {
        0: { cls: "wi-day-sunny", txt: "CLEAR" },
        1: { cls: "wi-day-cloudy", txt: "MOSTLY CLEAR" },
        2: { cls: "wi-day-cloudy", txt: "PARTLY CLOUDY" },
        3: { cls: "wi-cloudy", txt: "OVERCAST" },
        45: { cls: "wi-fog", txt: "AMB FOG BOUND" },
        48: { cls: "wi-fog", txt: "RIME FOG" },
        51: { cls: "wi-sprinkle", txt: "LIGHT DRIZZLE" },
        53: { cls: "wi-sprinkle", txt: "MODERAT DRIZZLE" },
        55: { cls: "wi-sprinkle", txt: "HEAVY DRIZZLE" },
        61: { cls: "wi-rain", txt: "LIGHT RAIN" },
        63: { cls: "wi-rain", txt: "MODERATE RAIN" },
        65: { cls: "wi-rain-wind", txt: "HEAVY RAIN" },
        71: { cls: "wi-snow", txt: "LIGHT SNOW" },
        73: { cls: "wi-snow", txt: "MODERATE SNOW" },
        75: { cls: "wi-snow-wind", txt: "HEAVY SNOW" },
        80: { cls: "wi-showers", txt: "LIGHT SHOWERS" },
        81: { cls: "wi-showers", txt: "MOD SHOWERS" },
        82: { cls: "wi-thunderstorm", txt: "TORRENT SHOWERS" },
        95: { cls: "wi-thunderstorm", txt: "T-STORMS ACTIVE" },
        96: { cls: "wi-storm-showers", txt: "SEV T-STORMS" },
        99: { cls: "wi-lightning", txt: "SEVERE OUTBREAK" }
    };
    
    const match = wmoMap[code] || { cls: "wi-na", txt: "UNCLASSIFIED" };
    iconNode.classList.add(match.cls);
    if(txtNode) txtNode.innerText = match.txt;
    
    return match;
}

// Programmatic 7-Day Forecast Generation Module
function buildSevenDayOutlook(dailyData) {
    const tbody = document.getElementById("extended-table-body").getElementsByTagName('tbody')[0];
    tbody.innerHTML = ""; // Clean structural arrays
    
    for (let i = 0; i < dailyData.time.length; i++) {
        const dateObj = new Date(dailyData.time[i] * 1000);
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        
        const row = tbody.insertRow();
        row.insertCell(0).innerText = dayLabel;
        
        // Icon Processing Injection
        const iconCell = row.insertCell(1);
        const iconElement = document.createElement("i");
        iconElement.className = "wi ";
        
        const wmoData = mapWmoCodeToVintageTWCFont(dailyData.weather_code[i], "twc-font-icon", null);
        iconElement.classList.add(wmoData.cls);
        iconElement.style.fontSize = "1.3rem";
        iconCell.appendChild(iconElement);
        
        row.insertCell(2).innerText = `${Math.round(dailyData.temperature_2m_max[i])}°F`;
        row.insertCell(3).innerText = `${Math.round(dailyData.temperature_2m_min[i])}°F`;
        row.insertCell(4).innerText = `${dailyData.precipitation_probability_max[i]}%`;
    }
}

// Programmatic 72-Hour Hourly Table Builder Module
function buildHourlyForecastTable(hourlyData) {
    const tbody = document.getElementById("hourly-table-body").getElementsByTagName('tbody')[0];
    tbody.innerHTML = "";
    
    // Loop through maximum range threshold of 72 coordinate timestamps
    const limit = Math.min(hourlyData.time.length, 72);
    
    for (let i = 0; i < limit; i++) {
        const hourObj = new Date(hourlyData.time[i] * 1000);
        const stampString = hourObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) + " " + hourObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const row = tbody.insertRow();
        row.insertCell(0).innerText = stampString;
        
        // Render embedded fonts indicators
        const iconCell = row.insertCell(1);
        const iconI = document.createElement("i");
        iconI.className = "wi ";
        const wmoData = mapWmoCodeToVintageTWCFont(hourlyData.weather_code[i], "twc-font-icon", null);
        iconI.classList.add(wmoData.cls);
        iconCell.appendChild(iconI);
        
        row.insertCell(2).innerText = `${Math.round(hourlyData.temperature_2m[i])}°F`;
        row.insertCell(3).innerText = `${Math.round(hourlyData.dew_point_2m[i])}°F`;
        row.insertCell(4).innerText = `${Math.round(hourlyData.wind_speed_10m[i])} MPH`;
        row.insertCell(5).innerText = `${hourlyData.precipitation_probability[i]}%`;
    }
}

// 3. National Weather Service Dynamic Critical Warning Scraper
async function fetchNationalWeatherServiceAlerts() {
    const terminal = document.getElementById("nws-alert-terminal");
    const banner = document.getElementById("alert-banner");
    
    try {
        const resPoint = await fetch(`https://api.weather.gov/points/${targetLat},${targetLon}`);
        if (!resPoint.ok) throw new Error("Point translation boundary failed.");
        const pData = await resPoint.json();
        
        const countyZoneUrl = pData.properties.county;
        const targetZoneId = countyZoneUrl.split('/').pop();
        
        const resAlerts = await fetch(`https://api.weather.gov/alerts/active/zone/${targetZoneId}`);
        if (!resAlerts.ok) throw new Error("Active alert arrays database time out.");
        const aData = await resAlerts.json();
        
        if (aData.features && aData.features.length > 0) {
            let processedTextBlocks = "";
            let extremeHazardVector = false;
            
            aData.features.forEach(feat => {
                const head = feat.properties.headline;
                const desc = feat.properties.description;
                processedTextBlocks += `>>> INCIDENT LOG INITIATED\nHEADLINE: ${head}\n\n${desc}\n\n=========================================\n\n`;
                
                if (desc.toUpperCase().includes("TORNADO") || desc.toUpperCase().includes("PARTICULARLY DANGEROUS SITUATION") || desc.toUpperCase().includes("SEVERE THUNDERSTORM WARNING")) {
                    extremeHazardVector = true;
                }
            });
            
            terminal.innerText = processedTextBlocks;
            
            if (extremeHazardVector) {
                banner.style.display = "block";
                banner.innerText = "🚨 SEVERE ATMOSPHERIC HAZARD ENCOUNTERED IN THE LOCAL GRID SPHERE";
                banner.style.background = "var(--alert-red)";
            } else {
                banner.style.display = "block";
                banner.innerText = "REGIONAL ADVISORIES DETECTED VIA NATIONAL WEATHER OFFICE TELEMETRY";
                banner.style.background = "var(--vintage-gold)";
                banner.style.color = "#000";
            }
        } else {
            terminal.innerText = "NO ACTIVE CRITICAL WEATHER WATCHES, WARNINGS, OR EMERGENCY STATEMENTS GENERATED FOR THE TARGET COUNTY GRID FOOTPRINT.";
            banner.style.display = "none";
        }
        
    } catch (err) {
        terminal.innerText = `[NWS API JUNCTION FAULT] Stalled during ingestion arrays: ${err.message}\nRetrying next connection cycle...`;
        banner.style.display = "none";
    }
}

// 4. Free Storm Prediction Center Mesoscale Discussions XML RSS Scraper
async function scrapeStormPredictionCenterFeeds() {
    const mdFeedBox = document.getElementById("spc-md-feed");
    
    try {
        // Utilizing a free public open CORS proxy to parse the live XML feed directly inside the client browser framework
        const feedUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.spc.noaa.gov/products/md/md-rss.xml");
        const res = await fetch(feedUrl);
        if(!res.ok) throw new Error("RSS relay link dead.");
        const data = await res.json();
        
        const xmlText = data.contents;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = xmlDoc.getElementsByTagName("item");
        
        if(items.length === 0) {
            mdFeedBox.innerText = "NO ACTIVE CONVECTIVE MESOSCALE DISCUSSIONS DETECTED NATIONWIDE CURRENTLY.";
            return;
        }
        
        let mdHtmlContent = "";
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const title = items[i].getElementsByTagName("title")[0].textContent;
            const link = items[i].getElementsByTagName("link")[0].textContent;
            const desc = items[i].getElementsByTagName("description")[0].textContent;
            
            mdHtmlContent += `
                <div class="md-item">
                    <a href="${link}" target="_blank">⛈️ ${title}</a>
                    <p style="margin:5px 0 0 0; font-size:0.8rem; color:var(--text-dim);">${desc}</p>
                </div>
            `;
        }
        mdFeedBox.innerHTML = mdHtmlContent;
        
    } catch(err) {
        mdFeedBox.innerText = `[SPC SERVER OVERFLOW] Unable to secure live XML RSS matrices: ${err.message}\nReview manual server indices manually.`;
    }
}
