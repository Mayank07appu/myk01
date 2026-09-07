/**
 * Velox Interactive City Map & Weather/Traffic Visualizer
 * High-performance Canvas animation representing real-time traffic routes,
 * active driver fleet telemetry, and meteorological particle effects.
 */

class MapVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.weatherId = 'clear';
        this.trafficId = 'moderate';
        this.activeTier = 'go';

        this.particles = [];
        this.vehicles = [];
        this.lightningFlash = 0;
        this.heatOffset = 0;
        this.animationFrameId = null;

        // Route geometry (normalized coordinates 0 to 1)
        this.routePoints = [
            { x: 0.18, y: 0.72 }, // Pickup: Downtown Station
            { x: 0.32, y: 0.72 },
            { x: 0.32, y: 0.45 },
            { x: 0.58, y: 0.45 },
            { x: 0.58, y: 0.28 },
            { x: 0.82, y: 0.28 }  // Dropoff: Metro Tech Park
        ];

        this.rideCar = {
            progress: 0,
            speed: 0.003
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initParticles();
        this.initFleet();
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = Math.max(340, Math.min(rect.width * 0.55, 460));

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);
        this.initParticles();
    }

    setEnvironment(weatherId, trafficId, activeTier = 'go') {
        const weatherChanged = this.weatherId !== weatherId;
        this.weatherId = weatherId;
        this.trafficId = trafficId;
        this.activeTier = activeTier;

        const speedMultiplierMap = {
            low: 1.4,
            moderate: 1.0,
            heavy: 0.55,
            gridlock: 0.28
        };
        this.rideCar.speed = 0.003 * (speedMultiplierMap[trafficId] || 1.0);

        if (weatherChanged) {
            this.initParticles();
        }
    }

    initParticles() {
        this.particles = [];
        const count = this.weatherId === 'heavy_rain' ? 220 :
                      this.weatherId === 'light_rain' ? 100 :
                      this.weatherId === 'snow' ? 140 :
                      this.weatherId === 'heatwave' ? 45 : 25;

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * (this.width || 600),
            y: Math.random() * (this.height || 400),
            vx: this.weatherId === 'snow' ? (Math.random() - 0.5) * 1.2 : (Math.random() - 0.5) * 0.4 - 1.2,
            vy: this.weatherId === 'heavy_rain' ? 12 + Math.random() * 8 :
                this.weatherId === 'light_rain' ? 6 + Math.random() * 4 :
                this.weatherId === 'snow' ? 1.2 + Math.random() * 2 :
                this.weatherId === 'heatwave' ? -(0.5 + Math.random() * 1.5) :
                (Math.random() - 0.5) * 0.4,
            size: this.weatherId === 'snow' ? 2 + Math.random() * 3.5 :
                  this.weatherId === 'heavy_rain' ? 18 + Math.random() * 12 :
                  this.weatherId === 'light_rain' ? 10 + Math.random() * 8 :
                  this.weatherId === 'heatwave' ? 3 + Math.random() * 4 :
                  1.5 + Math.random() * 2,
            alpha: 0.3 + Math.random() * 0.6,
            phase: Math.random() * Math.PI * 2
        };
    }

    initFleet() {
        this.vehicles = [];
        for (let i = 0; i < 16; i++) {
            this.vehicles.push({
                x: 0.05 + Math.random() * 0.9,
                y: 0.05 + Math.random() * 0.9,
                targetX: 0.05 + Math.random() * 0.9,
                targetY: 0.05 + Math.random() * 0.9,
                speed: 0.0008 + Math.random() * 0.0015,
                color: i % 3 === 0 ? '#38bdf8' : '#94a3b8'
            });
        }
    }

    startLoop() {
        const loop = () => {
            this.update();
            this.draw();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    update() {
        this.rideCar.progress += this.rideCar.speed;
        if (this.rideCar.progress > 1) {
            this.rideCar.progress = 0;
        }

        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (this.weatherId === 'snow') {
                p.x += Math.sin(p.phase) * 0.6;
                p.phase += 0.03;
            }

            if (p.y > this.height) {
                p.y = -10;
                p.x = Math.random() * this.width;
            } else if (p.y < -10 && this.weatherId === 'heatwave') {
                p.y = this.height + 10;
                p.x = Math.random() * this.width;
            }
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;
        }

        if (this.weatherId === 'heavy_rain') {
            if (this.lightningFlash > 0) {
                this.lightningFlash -= 0.08;
            } else if (Math.random() < 0.008) {
                this.lightningFlash = 0.8;
            }
        } else {
            this.lightningFlash = 0;
        }

        if (this.weatherId === 'heatwave') {
            this.heatOffset += 0.04;
        }

        for (let v of this.vehicles) {
            const dx = v.targetX - v.x;
            const dy = v.targetY - v.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 0.02) {
                v.targetX = 0.05 + Math.random() * 0.9;
                v.targetY = 0.05 + Math.random() * 0.9;
            } else {
                v.x += (dx / dist) * v.speed;
                v.y += (dy / dist) * v.speed;
            }
        }
    }

    getPointOnRoute(progress) {
        const segments = this.routePoints.length - 1;
        const totalProgress = Math.max(0, Math.min(1, progress)) * segments;
        const segmentIndex = Math.min(Math.floor(totalProgress), segments - 1);
        const segmentProgress = totalProgress - segmentIndex;

        const p1 = this.routePoints[segmentIndex];
        const p2 = this.routePoints[segmentIndex + 1];

        return {
            x: (p1.x + (p2.x - p1.x) * segmentProgress) * this.width,
            y: (p1.y + (p2.y - p1.y) * segmentProgress) * this.height,
            angle: Math.atan2((p2.y - p1.y) * this.height, (p2.x - p1.x) * this.width)
        };
    }

    draw() {
        const { ctx, width, height } = this;
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0b1120');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
        ctx.lineWidth = 1;
        const gridSize = 42;
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.45);
        ctx.lineTo(width, height * 0.45);
        ctx.moveTo(0, height * 0.72);
        ctx.lineTo(width, height * 0.72);
        ctx.moveTo(width * 0.32, 0);
        ctx.lineTo(width * 0.32, height);
        ctx.moveTo(width * 0.58, 0);
        ctx.lineTo(width * 0.58, height);
        ctx.stroke();

        for (let v of this.vehicles) {
            ctx.fillStyle = v.color;
            ctx.beginPath();
            ctx.arc(v.x * width, v.y * height, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const trafficColors = {
            low: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', label: 'Normal Flow (38 mph)' },
            moderate: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', label: 'Moderate Drag (24 mph)' },
            heavy: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)', label: 'Heavy Crawl (14 mph)' },
            gridlock: { main: '#e11d48', glow: 'rgba(225, 29, 72, 0.65)', label: 'Severe Gridlock (6 mph)' }
        };
        const currentTrafficStyle = trafficColors[this.trafficId] || trafficColors.moderate;

        ctx.save();
        ctx.shadowColor = currentTrafficStyle.main;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = currentTrafficStyle.main;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        this.routePoints.forEach((pt, i) => {
            const rx = pt.x * width;
            const ry = pt.y * height;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
        });
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        const pickupPt = this.routePoints[0];
        const dropoffPt = this.routePoints[this.routePoints.length - 1];

        this.drawPin(pickupPt.x * width, pickupPt.y * height, '#38bdf8', 'Pickup');
        this.drawPin(dropoffPt.x * width, dropoffPt.y * height, '#a855f7', 'Dropoff');

        const carPos = this.getPointOnRoute(this.rideCar.progress);
        ctx.save();
        ctx.translate(carPos.x, carPos.y);
        ctx.rotate(carPos.angle);

        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(-10, -6, 20, 12, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(8, -4, 2, 2);
        ctx.fillRect(8, 2, 2, 2);
        ctx.restore();

        this.drawWeatherEffects();
        this.drawHUD(currentTrafficStyle);
    }

    drawPin(x, y, color, label) {
        const { ctx } = this;
        const t = (Date.now() % 2000) / 2000;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 8 + t * 14, 0, Math.PI * 2);
        ctx.globalAlpha = 1 - t;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        const textWidth = ctx.measureText(label).width;
        ctx.beginPath();
        ctx.roundRect(x - textWidth / 2 - 6, y - 24, textWidth + 12, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 12);
    }

    drawWeatherEffects() {
        const { ctx, width, height } = this;

        if (this.weatherId === 'heavy_rain' && this.lightningFlash > 0) {
            ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningFlash * 0.45})`;
            ctx.fillRect(0, 0, width, height);
        }

        if (this.weatherId === 'heatwave') {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
            ctx.fillRect(0, 0, width, height);
        }

        for (let p of this.particles) {
            ctx.save();
            if (this.weatherId === 'light_rain' || this.weatherId === 'heavy_rain') {
                ctx.strokeStyle = this.weatherId === 'heavy_rain' ? 'rgba(186, 230, 253, 0.75)' : 'rgba(147, 197, 253, 0.55)';
                ctx.lineWidth = this.weatherId === 'heavy_rain' ? 1.8 : 1.2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 1.6, p.y + p.size);
                ctx.stroke();
            } else if (this.weatherId === 'snow') {
                ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha})`;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.weatherId === 'heatwave') {
                ctx.fillStyle = `rgba(251, 146, 60, ${p.alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha * 0.35})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawHUD(trafficStyle) {
        const { ctx } = this;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(14, 14, 190, 68, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('LIVE CORRIDOR TELEMETRY', 26, 32);

        ctx.fillStyle = trafficStyle.main;
        ctx.beginPath();
        ctx.arc(29, 48, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(trafficStyle.label, 38, 51);

        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Weather Sensor: ${this.weatherId.toUpperCase()}`, 26, 68);

        ctx.restore();
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Global attachment
if (typeof window !== 'undefined') {
    window.MapVisualizer = MapVisualizer;
}
