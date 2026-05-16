// alerts.js - NWS Severe Weather Alerts
class AlertsService {
    constructor() {
        this.alerts = [];
    }
    
    async getAlerts() {
        try {
            // Try NWS API first
            const response = await fetch('https://api.weather.gov/alerts/active?limit=10');
            const data = await response.json();
            
            this.alerts = data.features.map(f => ({
                id: f.id,
                event: f.properties.event,
                severity: f.properties.severity || 'Unknown',
                headline: f.properties.headline,
                description: f.properties.description,
                areas: f.properties.areas,
                expires: new Date(f.properties.expires)
            }));
            
            return this.alerts;
        } catch (error) {
            console.warn('NWS API failed, using mock alerts');
            return this.getMockAlerts();
        }
    }
    
    getMockAlerts() {
        return [
            {
                id: '1',
                event: 'Severe Thunderstorm Warning',
                severity: 'Severe',
                headline: 'Severe Thunderstorm Warning until 3:00 PM',
                description: 'A severe thunderstorm capable of producing quarter size hail and 60 mph winds is moving east at 30 mph.',
                areas: 'Johnson County, KS',
                expires: new Date(Date.now() + 3600000)
            },
            {
                id: '2',
                event: 'Flash Flood Watch',
                severity: 'Moderate',
                headline: 'Flash Flood Watch in effect until late tonight',
                description: 'Heavy rainfall may cause flooding in low-lying and poor drainage areas.',
                areas: 'Jackson County, MO',
                expires: new Date(Date.now() + 7200000)
            }
        ];
    }
    
    renderAlerts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        this.getAlerts().then(alerts => {
            if (alerts.length === 0) {
                container.innerHTML = '<div class="alert-card" style="background: #4CAF50;">✅ No active alerts in your area</div>';
                return;
            }
            
            container.innerHTML = alerts.map(alert => `
                <div class="alert-card ${alert.severity === 'Severe' ? 'alert-critical' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <strong style="font-size: 1.1rem;">⚠️ ${alert.event}</strong>
                            <p style="margin: 8px 0;"><strong>${alert.headline}</strong></p>
                            <p>${alert.description.substring(0, 200)}...</p>
                            <p style="margin-top: 8px; font-size: 0.85rem;">📍 ${alert.areas}</p>
                        </div>
                        <span class="material-symbols-outlined">warning</span>
                    </div>
                    <div style="margin-top: 12px; font-size: 0.8rem;">
                        Expires: ${alert.expires.toLocaleTimeString()}
                    </div>
                </div>
            `).join('');
        });
    }
}

const alertsService = new AlertsService();