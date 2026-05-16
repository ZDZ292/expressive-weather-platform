// engine.js - Expressive Weather Platform Processing Core

document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initial data pull and image reload timers
    fetchNWSAlerts();
    setInterval(fetchNWSAlerts, 60000); // Scrape raw text updates every 60 seconds
    setInterval(refreshImages, 300000);  // Clear image cache cycles every 5 minutes
});

// 1. Precise UTC Diagnostic Clock
function updateClock() {
    const now = new Date();
    const utcString = now.toUTCString().replace("GMT", "UTC");
    document.getElementById("clock").innerText = utcString;
}

// 2. No-API Auto Overwriting Image Refresh Technique
// Appends a micro-timestamp string to break local cache limits every cycle
function refreshImages() {
    const timestamp = new Date().getTime();
    
    const spcImg = document.getElementById("spc-outlook");
    const mesoImg = document.getElementById("meso-sector");
    
    spcImg.src = "https://www.spc.noaa.gov/products/outlook/day1otlk.gif?t=" + timestamp;
    mesoImg.src = "https://www.spc.noaa.gov/exper/mesoanalysis/s11/sbcape.gif?t=" + timestamp;
    
    console.log("Analog cache cycle broke. Images re-buffered at timestamp: " + timestamp);
}

// 3. Free Public Zero-Auth NWS API Scrape Engine
async function fetchNWSAlerts() {
    const terminal = document.getElementById("nws-terminal");
    const banner = document.getElementById("ticker-banner");
    
    // NWS Public Zone code for Cook County (ILZ104)
    const zoneId = "ILZ104"; 
    
    try {
        const response = await fetch(`https://api.weather.gov/alerts/active/zone/${zoneId}`);
        if (!response.ok) throw new Error("Network response stalled.");
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            let compiledAlerts = "";
            let pdsDetected = false;
            
            data.features.forEach(alert => {
                const headline = alert.properties.headline;
                const description = alert.properties.description;
                
                compiledAlerts += `=== ALERT INITIATED ===\nHEADLINE: ${headline}\n\n${description}\n\n`;
                
                // Scan text vectors for critical severe threshold phrasing
                if (description.toUpperCase().includes("PARTICULARLY DANGEROUS SITUATION") || 
                    description.toUpperCase().includes("TORNADO EMERGENCY")) {
                    pdsDetected = true;
                }
            });
            
            terminal.innerText = compiledAlerts;
            
            // If text verification matches high-end threat, engage visual alert overrides
            if (pdsDetected) {
                banner.style.display = "block";
                banner.style.background = "#ff3333";
                banner.innerText = "🚨 CRITICAL THREAT MATRIX DETECTED: PARTIALLY DANGEROUS SITUATION / EMERGENCY CURRENTLY ACTIVE";
            } else {
                banner.style.display = "block";
                banner.style.background = "#1f2833";
                banner.innerText = "ACTIVE NWS BULLETINS ENGAGED IN THE METRO AREA. SCANNING RADAR VECTOR.";
            }
        } else {
            terminal.innerText = "NO ACTIVE SEVERE WEATHER WARNS/WATCHES DETECTED FOR ZONE ILZ104.\n\nATMOSPHERE STATUS: MONITORING STABLE CONVECTIVE ENVIRONMENT.";
            banner.style.display = "none";
        }
        
    } catch (error) {
        terminal.innerText = `[ERROR] Failed to map live NWS API stream: ${error.message}\nRetrying connection string next cycle...`;
    }
}

// 4. Interactive Verification Matrix Engine
function setScenario(scenarioNum) {
    // Clear out active styling across all button classes
    const buttons = document.querySelectorAll(".matrix-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    // Highlight selected button toggle
    const activeBtn = event.currentTarget;
    activeBtn.classList.add("active");
    
    const terminal = document.getElementById("nws-terminal");
    
    // Append user-verified verification status to terminal logs manually
    const timestamp = new Date().toLocaleTimeString();
    let confirmationLog = `\n\n[USER VERIFICATION AT ${timestamp}]: Mode verified to SCENARIO ${scenarioNum}.\n`;
    
    if (scenarioNum === 1) {
        confirmationLog += "STATUS: RRFS Double-Barrel Mode processing. Tracking Round 1 midday bowing cluster features directly.";
    } else if (scenarioNum === 2) {
        confirmationLog += "STATUS: HRRR Convective Contamination confirmed. Northern IL airmass locked down. Severe risk shifting south/west.";
    } else if (scenarioNum === 3) {
        confirmationLog += "STATUS: Cap-Breaker initialized. Morning dry. Massive daytime thermodynamics loading. Standby for discrete supercell firing.";
    }
    
    terminal.innerText += confirmationLog;
    terminal.scrollTop = terminal.scrollHeight; // Force terminal view windows to drop down to newest data array
}
