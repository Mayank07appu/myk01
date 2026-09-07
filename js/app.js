/**
 * Velox Dynamic Pricing Application Controller
 * Connects UI inputs, pricing algorithms, dynamic canvas map, and Chart.js analytics.
 */

// Access PricingEngine and MapVisualizer from globals or imports
const { calculateFare, RIDE_TIERS, WEATHER_CONDITIONS, TRAFFIC_LEVELS } = window.PricingEngine || {};
const MapVisualizer = window.MapVisualizer;

class AppController {
    constructor() {
        this.state = {
            tierId: 'go',
            distanceMiles: 8.5,
            baseDurationMinutes: 18,
            weatherId: 'clear',
            trafficId: 'moderate',
            demandSupplyRatio: 1.0,
            isEmergencyCapActive: false
        };

        this.mapVisualizer = null;
        this.sensitivityChart = null;

        this.init();
    }

    init() {
        this.renderTierOptions();
        this.renderWeatherOptions();
        this.renderTrafficOptions();

        // Initialize Map Visualizer
        if (typeof MapVisualizer === 'function') {
            this.mapVisualizer = new MapVisualizer('cityMapCanvas');
        }

        // Initialize Sensitivity Chart
        this.initSensitivityChart();

        // Bind DOM Event Listeners
        this.bindEvents();

        // Initial Calculation & UI Refresh
        this.updatePricing();

        // Render Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderTierOptions() {
        const container = document.getElementById('tierSelector');
        if (!container || !RIDE_TIERS) return;

        container.innerHTML = Object.values(RIDE_TIERS).map(tier => `
            <div class="tier-card p-3 rounded-xl bg-dark-800 ${tier.id === this.state.tierId ? 'active' : ''}" data-tier="${tier.id}">
                <div class="flex items-center justify-between mb-1.5">
                    <i data-lucide="${tier.icon}" class="w-4 h-4 text-brand-400"></i>
                    <span class="text-[10px] font-mono text-slate-400 font-semibold">${tier.capacity}</span>
                </div>
                <div class="font-bold text-xs text-white">${tier.name}</div>
                <div class="text-[11px] font-mono text-slate-400 mt-0.5">$${tier.baseFare.toFixed(2)} + $${tier.perMileRate.toFixed(2)}/mi</div>
            </div>
        `).join('');
    }

    renderWeatherOptions() {
        const container = document.getElementById('weatherSelector');
        if (!container || !WEATHER_CONDITIONS) return;

        container.innerHTML = Object.values(WEATHER_CONDITIONS).map(w => `
            <div class="option-card p-2.5 rounded-xl text-center ${w.id === this.state.weatherId ? 'active' : ''}" data-weather="${w.id}">
                <div class="flex justify-center mb-1">
                    <i data-lucide="${w.icon}" class="w-4 h-4 text-amber-400"></i>
                </div>
                <div class="font-semibold text-xs text-white truncate">${w.name.split('/')[0].trim()}</div>
                <div class="text-[10px] font-mono text-amber-400 mt-0.5 font-bold">${w.multiplier.toFixed(2)}x</div>
            </div>
        `).join('');
    }

    renderTrafficOptions() {
        const container = document.getElementById('trafficSelector');
        if (!container || !TRAFFIC_LEVELS) return;

        container.innerHTML = Object.values(TRAFFIC_LEVELS).map(t => `
            <div class="option-card p-2.5 rounded-xl text-center ${t.id === this.state.trafficId ? 'active' : ''}" data-traffic="${t.id}">
                <div class="flex justify-center mb-1">
                    <i data-lucide="${t.icon}" class="w-4 h-4 text-emerald-400"></i>
                </div>
                <div class="font-semibold text-xs text-white truncate">${t.name}</div>
                <div class="text-[10px] font-mono text-emerald-400 mt-0.5 font-bold">${t.congestionFactor.toFixed(2)}x</div>
            </div>
        `).join('');
    }

    bindEvents() {
        // Tier Selection
        document.getElementById('tierSelector')?.addEventListener('click', (e) => {
            const card = e.target.closest('[data-tier]');
            if (!card) return;
            this.state.tierId = card.dataset.tier;
            document.querySelectorAll('#tierSelector .tier-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            this.updatePricing();
        });

        // Weather Selection
        document.getElementById('weatherSelector')?.addEventListener('click', (e) => {
            const card = e.target.closest('[data-weather]');
            if (!card) return;
            this.state.weatherId = card.dataset.weather;
            document.querySelectorAll('#weatherSelector .option-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            this.updatePricing();
        });

        // Traffic Selection
        document.getElementById('trafficSelector')?.addEventListener('click', (e) => {
            const card = e.target.closest('[data-traffic]');
            if (!card) return;
            this.state.trafficId = card.dataset.traffic;
            document.querySelectorAll('#trafficSelector .option-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            this.updatePricing();
        });

        // Distance Slider
        const distanceRange = document.getElementById('distanceRange');
        distanceRange?.addEventListener('input', (e) => {
            this.state.distanceMiles = parseFloat(e.target.value);
            const distVal = document.getElementById('distanceVal');
            if (distVal) distVal.textContent = `${this.state.distanceMiles.toFixed(1)} miles`;
            this.updatePricing();
        });

        // Duration Slider
        const durationRange = document.getElementById('durationRange');
        durationRange?.addEventListener('input', (e) => {
            this.state.baseDurationMinutes = parseInt(e.target.value, 10);
            const durVal = document.getElementById('durationVal');
            if (durVal) durVal.textContent = `${this.state.baseDurationMinutes} mins`;
            this.updatePricing();
        });

        // Surge Slider
        const surgeRange = document.getElementById('surgeRange');
        surgeRange?.addEventListener('input', (e) => {
            this.state.demandSupplyRatio = parseFloat(e.target.value);
            const req = Math.round(this.state.demandSupplyRatio * 100);
            let statusDesc = this.state.demandSupplyRatio > 1.4 ? 'High Shortage' :
                             this.state.demandSupplyRatio > 1.0 ? 'Elevated' :
                             this.state.demandSupplyRatio === 1.0 ? 'Balanced' : 'Surplus Fleet';
            const surgeVal = document.getElementById('surgeRatioVal');
            if (surgeVal) {
                surgeVal.textContent = `${this.state.demandSupplyRatio.toFixed(1)}x (${statusDesc}: ${req} req / 100 cars)`;
            }
            this.updatePricing();
        });

        // Emergency Toggle
        const emergencyToggle = document.getElementById('emergencyToggle');
        emergencyToggle?.addEventListener('change', (e) => {
            this.state.isEmergencyCapActive = e.target.checked;
            this.updatePricing();
        });

        // Preset Buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.loadPreset(preset);
            });
        });

        // Docs Modal Handlers
        const modal = document.getElementById('docsModal');
        const openDocs = () => modal?.classList.replace('hidden', 'flex');
        const closeDocs = () => modal?.classList.replace('flex', 'hidden');

        document.getElementById('btnOpenDocs')?.addEventListener('click', openDocs);
        document.getElementById('btnCloseDocs')?.addEventListener('click', closeDocs);
        document.getElementById('btnCloseDocsBottom')?.addEventListener('click', closeDocs);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeDocs();
        });
    }

    loadPreset(preset) {
        if (preset === 'sunny_noon') {
            this.state.tierId = 'go';
            this.state.weatherId = 'clear';
            this.state.trafficId = 'low';
            this.state.demandSupplyRatio = 0.9;
            this.state.isEmergencyCapActive = false;
        } else if (preset === 'storm_rush') {
            this.state.tierId = 'go';
            this.state.weatherId = 'heavy_rain';
            this.state.trafficId = 'heavy';
            this.state.demandSupplyRatio = 2.0;
            this.state.isEmergencyCapActive = false;
        } else if (preset === 'blizzard_surge') {
            this.state.tierId = 'comfort';
            this.state.weatherId = 'snow';
            this.state.trafficId = 'gridlock';
            this.state.demandSupplyRatio = 2.5;
            this.state.isEmergencyCapActive = false;
        } else if (preset === 'emergency') {
            this.state.tierId = 'go';
            this.state.weatherId = 'snow';
            this.state.trafficId = 'gridlock';
            this.state.demandSupplyRatio = 2.6;
            this.state.isEmergencyCapActive = true;
        }

        // Sync form elements
        document.querySelectorAll('#tierSelector .tier-card').forEach(c => {
            c.classList.toggle('active', c.dataset.tier === this.state.tierId);
        });
        document.querySelectorAll('#weatherSelector .option-card').forEach(c => {
            c.classList.toggle('active', c.dataset.weather === this.state.weatherId);
        });
        document.querySelectorAll('#trafficSelector .option-card').forEach(c => {
            c.classList.toggle('active', c.dataset.traffic === this.state.trafficId);
        });

        const surgeRange = document.getElementById('surgeRange');
        if (surgeRange) {
            surgeRange.value = this.state.demandSupplyRatio;
            const req = Math.round(this.state.demandSupplyRatio * 100);
            const surgeVal = document.getElementById('surgeRatioVal');
            if (surgeVal) {
                surgeVal.textContent = `${this.state.demandSupplyRatio.toFixed(1)}x (${req} req / 100 cars)`;
            }
        }

        const emergencyToggle = document.getElementById('emergencyToggle');
        if (emergencyToggle) {
            emergencyToggle.checked = this.state.isEmergencyCapActive;
        }

        this.updatePricing();
    }

    updatePricing() {
        if (typeof calculateFare !== 'function') return;

        const result = calculateFare(this.state);
        const { tier, weather, traffic, inputs, breakdown, financials } = result;

        // 1. Sync Tier & Weather & Traffic Badges
        const tierBadge = document.getElementById('tierBadge');
        if (tierBadge) tierBadge.textContent = tier.name;

        const weatherBadge = document.getElementById('weatherMultiplierBadge');
        if (weatherBadge) weatherBadge.textContent = `${weather.multiplier.toFixed(2)}x`;

        const weatherDesc = document.getElementById('weatherDescription');
        if (weatherDesc) {
            weatherDesc.textContent = `${weather.description} Hazard Bonus: +$${weather.hazardBonusPerMile.toFixed(2)}/mile directly to driver.`;
        }

        const trafficBadge = document.getElementById('trafficMultiplierBadge');
        if (trafficBadge) trafficBadge.textContent = `${traffic.congestionFactor.toFixed(2)}x`;

        const trafficDesc = document.getElementById('trafficDescription');
        if (trafficDesc) trafficDesc.textContent = `${traffic.description} Duration multiplier: ${traffic.speedFactor.toFixed(2)}x.`;

        const surgeBadge = document.getElementById('surgeMultiplierBadge');
        if (surgeBadge) surgeBadge.textContent = `${breakdown.rawSurgeMultiplier.toFixed(2)}x Surge`;

        const effectiveDurVal = document.getElementById('effectiveDurationVal');
        if (effectiveDurVal) effectiveDurVal.textContent = `${inputs.effectiveDurationMinutes} mins`;

        // 2. Sync Ledger Numbers
        const fareTotal = document.getElementById('fareTotal');
        if (fareTotal) fareTotal.textContent = `$${financials.finalFare.toFixed(2)}`;

        const farePerMile = document.getElementById('farePerMile');
        if (farePerMile) farePerMile.textContent = `($${financials.effectiveRatePerMile.toFixed(2)}/mi)`;

        const ledgerBase = document.getElementById('ledgerBase');
        if (ledgerBase) ledgerBase.textContent = `$${breakdown.baseFare.toFixed(2)}`;

        const ledgerDistanceLabel = document.getElementById('ledgerDistanceLabel');
        if (ledgerDistanceLabel) ledgerDistanceLabel.textContent = `Distance (${inputs.distanceMiles} mi × $${tier.perMileRate.toFixed(2)}):`;

        const ledgerDistance = document.getElementById('ledgerDistance');
        if (ledgerDistance) ledgerDistance.textContent = `$${breakdown.distanceCost.toFixed(2)}`;

        const ledgerTimeLabel = document.getElementById('ledgerTimeLabel');
        if (ledgerTimeLabel) ledgerTimeLabel.textContent = `Time (${inputs.effectiveDurationMinutes} min × $${tier.perMinuteRate.toFixed(2)}):`;

        const ledgerTime = document.getElementById('ledgerTime');
        if (ledgerTime) ledgerTime.textContent = `$${breakdown.timeCost.toFixed(2)}`;

        const ledgerSubtotal = document.getElementById('ledgerSubtotal');
        if (ledgerSubtotal) ledgerSubtotal.textContent = `$${breakdown.standardTripSubtotal.toFixed(2)}`;

        const ledgerWeatherMult = document.getElementById('ledgerWeatherMult');
        if (ledgerWeatherMult) ledgerWeatherMult.textContent = `× ${breakdown.weatherMultiplier.toFixed(2)}`;

        const ledgerHazardBonus = document.getElementById('ledgerHazardBonus');
        if (ledgerHazardBonus) ledgerHazardBonus.textContent = `+$${breakdown.weatherHazardBonus.toFixed(2)}`;

        const ledgerTrafficMult = document.getElementById('ledgerTrafficMult');
        if (ledgerTrafficMult) ledgerTrafficMult.textContent = `× ${breakdown.trafficMultiplier.toFixed(2)}`;

        const ledgerSurgeMult = document.getElementById('ledgerSurgeMult');
        if (ledgerSurgeMult) ledgerSurgeMult.textContent = `× ${breakdown.rawSurgeMultiplier.toFixed(2)}`;

        // Multiplier Tag & Anti-gouging Alert
        const tag = document.getElementById('multiplierStatusTag');
        const alertTag = document.getElementById('antiGougingAlert');
        if (tag) {
            tag.textContent = `${breakdown.combinedMultiplier.toFixed(2)}x Net Factor`;
            if (breakdown.antiGougingCapApplied) {
                tag.className = 'text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30';
                alertTag?.classList.remove('hidden');
            } else if (breakdown.combinedMultiplier > 1.6) {
                tag.className = 'text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30';
                alertTag?.classList.add('hidden');
            } else {
                tag.className = 'text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
                alertTag?.classList.add('hidden');
            }
        }

        // Driver Share Split
        const driverSharePct = document.getElementById('driverSharePct');
        if (driverSharePct) driverSharePct.textContent = financials.driverSharePercent;

        const driverPayout = document.getElementById('driverPayout');
        if (driverPayout) driverPayout.textContent = `$${financials.driverPayout.toFixed(2)}`;

        const platformTake = document.getElementById('platformTake');
        if (platformTake) platformTake.textContent = `$${financials.platformTake.toFixed(2)}`;

        const driverSplitBar = document.getElementById('driverSplitBar');
        if (driverSplitBar) driverSplitBar.style.width = `${financials.driverSharePercent}%`;

        const platformSplitBar = document.getElementById('platformSplitBar');
        if (platformSplitBar) platformSplitBar.style.width = `${100 - financials.driverSharePercent}%`;

        // Live Equation Display
        const formulaBase = document.getElementById('formulaBase');
        if (formulaBase) formulaBase.textContent = `$${breakdown.baseFare.toFixed(2)}`;

        const formulaWeather = document.getElementById('formulaWeather');
        if (formulaWeather) formulaWeather.textContent = `${breakdown.weatherMultiplier.toFixed(2)}x (+$${breakdown.weatherHazardBonus.toFixed(2)})`;

        const formulaTraffic = document.getElementById('formulaTraffic');
        if (formulaTraffic) formulaTraffic.textContent = `${breakdown.trafficMultiplier.toFixed(2)}x (${inputs.effectiveDurationMinutes}m)`;

        const formulaSurge = document.getElementById('formulaSurge');
        if (formulaSurge) formulaSurge.textContent = `${breakdown.rawSurgeMultiplier.toFixed(2)}x`;

        const formulaFinal = document.getElementById('formulaFinal');
        if (formulaFinal) formulaFinal.textContent = `$${financials.finalFare.toFixed(2)}`;

        // Sync Map Visualizer
        if (this.mapVisualizer) {
            this.mapVisualizer.setEnvironment(this.state.weatherId, this.state.trafficId, this.state.tierId);
        }

        const routeLabel = document.getElementById('routeCongestionLabel');
        if (routeLabel) {
            routeLabel.textContent = `Route Flow: ${traffic.name}`;
            routeLabel.className = this.state.trafficId === 'low' ? 'text-emerald-400' :
                                  this.state.trafficId === 'moderate' ? 'text-amber-400' : 'text-rose-400';
        }

        // Update Sensitivity Chart
        this.updateSensitivityChart();

        // Refresh icons if needed
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    initSensitivityChart() {
        const canvas = document.getElementById('sensitivityChart');
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const ratios = [0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.4, 2.8];

        this.sensitivityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ratios.map(r => `${r}x`),
                datasets: [
                    {
                        label: 'Projected Fare ($)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#0f172a',
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: 'JetBrains Mono', size: 11 },
                        bodyFont: { family: 'JetBrains Mono', size: 12 },
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: (ctx) => `Fare: $${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.25)' },
                        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(51, 65, 85, 0.25)' },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'JetBrains Mono', size: 10 },
                            callback: (val) => `$${val}`
                        }
                    }
                }
            }
        });
    }

    updateSensitivityChart() {
        if (!this.sensitivityChart || typeof calculateFare !== 'function') return;

        const ratios = [0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.4, 2.8];
        const fareData = ratios.map(r => {
            const tempRes = calculateFare({
                ...this.state,
                demandSupplyRatio: r
            });
            return tempRes.financials.finalFare;
        });

        this.sensitivityChart.data.datasets[0].data = fareData;
        this.sensitivityChart.update();
    }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});
