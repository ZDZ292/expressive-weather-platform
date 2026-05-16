// radar.js - NWS Ridge2 Radar Integration with Alert Overlays
class NWSRadar {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.radarLayer = null;
        this.alertLayers = [];
        this.currentProduct = 'reflectivity';
        this.userLocation = { lat: 39.8283, lon: -98.5795 };
        
        this.init();
    }
    
    init() {
        // Initialize Leaflet map
        this.map = L.map(this.mapElementId).setView([this.userLocation.lat, this.userLocation.lon], 7);
        
        // Add base tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 10,
            minZoom: 5
        }).addTo(this.map);
        
        // Load radar layer
        this.loadRadarLayer();
        
        // Load alert overlays
        this.loadAlertOverlays();
    }
    
    setUserLocation(lat, lon) {
        this.userLocation = { lat, lon };
        this.map.setView([lat, lon], 7);
        this.loadRadarLayer();
        this.loadAlertOverlays();
    }
    
    loadRadarLayer() {
        // Remove existing radar layer if any
        if (this.radarLayer) {
            this.map.removeLayer(this.radarLayer);
        }
        
        // NWS Ridge2 Radar Tiles
        // Using NOAA's NEXRAD Level 3 tiles
        const radarUrls = {
            reflectivity: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-{timestamp}/{z}/{x}/{y}.png',
            velocity: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-{timestamp}/{z}/{x}/{y}.png',
            spectrum: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0s-{timestamp}/{z}/{x}/{y}.png'
        };
        
        // Use current timestamp for fresh tiles
        const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60;
        
        const radarUrl = radarUrls[this.currentProduct].replace('{timestamp}', timestamp);
        
        // Create custom tile layer with time-based refresh
        this.radarLayer = L.tileLayer(radarUrl, {
            attribution: 'Radar: NOAA/NWS',
            opacity: 0.7,
            maxZoom: 10,
            minZoom: 5,
            crossOrigin: true
        });
        
        this.radarLayer.addTo(this.map);
        
        // Add timestamp to map
        this.addRadarTimestamp();
    }
    
    addRadarTimestamp() {
        const timestamp = new Date().toLocaleString();
        const control = L.control({ position: 'bottomleft' });
        control.onAdd = () => {
            const div = L.DomUtil.create('div', 'radar-timestamp');
            div.innerHTML = `🔄 NEXRAD Radar | ${timestamp}`;
            div.style.cssText = 'background: rgba(0,0,0,0.7); color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px;';
            return div;
        };
        control.addTo(this.map);
    }
    
    async loadAlertOverlays() {
        // Clear existing alert layers
        this.alertLayers.forEach(layer => {
            if (this.map) this.map.removeLayer(layer);
        });
        this.alertLayers = [];
        
        try {
            // Fetch active alerts from NWS
            const response = await fetch('https://api.weather.gov/alerts/active?limit=50');
            const data = await response.json();
            
            const alerts = data.features || [];
            
            for (const alert of alerts) {
                const geometry = alert.geometry;
                const severity = alert.properties.severity;
                const event = alert.properties.event;
                const headline = alert.properties.headline;
                
                if (geometry && geometry.type === 'Polygon') {
                    // Convert coordinates to Leaflet format
                    const coordinates = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    
                    // Set color based on severity
                    let color = '#ffaa00';
                    if (severity === 'Severe') color = '#ff0000';
                    if (severity === 'Extreme') color = '#ff00ff';
                    if (severity === 'Moderate') color = '#ff8800';
                    
                    // Create polygon with popup
                    const polygon = L.polygon(coordinates, {
                        color: color,
                        weight: 3,
                        opacity: 0.8,
                        fillOpacity: 0.3,
                        fillColor: color
                    }).addTo(this.map);
                    
                    polygon.bindPopup(`
                        <b>${event}</b><br>
                        ${headline}<br>
                        <small>Severity: ${severity}</small>
                    `);
                    
                    this.alertLayers.push(polygon);
                }
            }
            
            // Update alert count in UI
            this.updateAlertCount(alerts.length);
            
        } catch (error) {
            console.error('Failed to load alert overlays:', error);
            this.loadMockAlertOverlays();
        }
    }
    
    loadMockAlertOverlays() {
        // Mock alert polygons for demo when NWS API fails
        const mockAlerts = [
            { lat: 39.0, lon: -94.5, radius: 0.8, event: 'Severe Thunderstorm Warning', severity: 'Severe' },
            { lat: 38.8, lon: -95.0, radius: 0.5, event: 'Flash Flood Watch', severity: 'Moderate' }
        ];
        
        mockAlerts.forEach(alert => {
            const circle = L.circle([alert.lat, alert.lon], {
                radius: alert.radius * 100000,
                color: alert.severity === 'Severe' ? '#ff0000' : '#ff8800',
                weight: 2,
                fillOpacity: 0.3
            }).addTo(this.map);
            
            circle.bindPopup(`<b>${alert.event}</b><br>Active in this area`);
            this.alertLayers.push(circle);
        });
    }
    
    updateAlertCount(count) {
        const badge = document.getElementById('alertBadge');
        if (badge) {
            if (count > 0) {
                badge.classList.add('active');
                badge.textContent = count > 9 ? '9+' : count;
            } else {
                badge.classList.remove('active');
            }
        }
    }
    
    switchProduct(product) {
        this.currentProduct = product;
        this.loadRadarLayer();
    }
    
    refreshRadar() {
        this.loadRadarLayer();
        this.loadAlertOverlays();
    }
    
    refreshAlertsOnly() {
        this.loadAlertOverlays();
    }
}

// Initialize radar when DOM is ready
let radarInstance = null;

function initRadar(lat, lon) {
    if (radarInstance) {
        radarInstance.setUserLocation(lat, lon);
    } else {
        radarInstance = new NWSRadar('radarMap');
        if (lat && lon) radarInstance.setUserLocation(lat, lon);
    }
    return radarInstance;
}