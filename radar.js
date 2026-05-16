// radar.js - NEXRAD Radar Simulation with DBZ Scale
class NEXRADRadar {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.generateRadarData();
        this.draw();
        
        // Setup controls
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('refreshRadarBtn')?.addEventListener('click', () => this.refresh());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth - 40;
        this.canvas.width = width;
        this.canvas.height = width * 0.75;
        this.draw();
    }
    
    generateRadarData() {
        this.radarPoints = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        
        // Generate precipitation cells
        const numCells = 30 + Math.floor(Math.random() * 20);
        
        for (let i = 0; i < numCells; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // DBZ value between 0 and 100
            let dbz = 0;
            const rand = Math.random();
            if (rand < 0.5) dbz = 10 + Math.random() * 20;      // Light rain
            else if (rand < 0.8) dbz = 35 + Math.random() * 25;  // Moderate rain
            else dbz = 65 + Math.random() * 35;                   // Heavy rain/severe
            
            this.radarPoints.push({ x, y, dbz });
        }
        
        // Add storm clusters (higher DBZ areas)
        const numClusters = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numClusters; i++) {
            const clusterX = centerX + (Math.random() - 0.5) * maxRadius * 1.2;
            const clusterY = centerY + (Math.random() - 0.5) * maxRadius * 0.8;
            const clusterSize = 20 + Math.random() * 40;
            
            for (let j = 0; j < clusterSize; j++) {
                const offsetX = (Math.random() - 0.5) * 60;
                const offsetY = (Math.random() - 0.5) * 60;
                const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
                let dbz = 70 + (1 - distance / 60) * 30;
                dbz = Math.min(100, Math.max(40, dbz + (Math.random() - 0.5) * 15));
                
                this.radarPoints.push({
                    x: clusterX + offsetX,
                    y: clusterY + offsetY,
                    dbz: dbz
                });
            }
        }
    }
    
    getDBZColor(dbz) {
        if (dbz < 20) return '#00ff00';      // Light green - light rain
        if (dbz < 35) return '#aaff00';      // Yellow-green
        if (dbz < 45) return '#ffff00';      // Yellow - moderate
        if (dbz < 55) return '#ffcc00';      // Orange-yellow
        if (dbz < 65) return '#ff8800';      // Orange
        if (dbz < 75) return '#ff4400';      // Red-orange
        if (dbz < 85) return '#ff0000';      // Red - heavy
        return '#ff00ff';                     // Purple - extreme
    }
    
    draw() {
        if (!this.ctx) return;
        
        // Clear with dark background
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        
        // Draw range rings
        this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this.ctx.lineWidth = 1;
        for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw crosshairs
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.canvas.width, centerY);
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.canvas.height);
        this.ctx.stroke();
        
        // Draw radar data
        for (const point of this.radarPoints) {
            const x = (point.x - this.offsetX) * this.zoom;
            const y = (point.y - this.offsetY) * this.zoom;
            
            if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
                this.ctx.fillStyle = this.getDBZColor(point.dbz);
                const size = 3 * this.zoom;
                this.ctx.fillRect(x - size/2, y - size/2, size, size);
            }
        }
        
        // Draw center dot
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw legend text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Google Sans';
        this.ctx.fillText('NEXRAD Radar | DBZ Scale 0-100', 10, 20);
    }
    
    zoomIn() {
        this.zoom = Math.min(2, this.zoom + 0.15);
        this.draw();
    }
    
    zoomOut() {
        this.zoom = Math.max(0.6, this.zoom - 0.15);
        this.draw();
    }
    
    refresh() {
        this.generateRadarData();
        this.draw();
    }
}