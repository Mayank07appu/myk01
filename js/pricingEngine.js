/**
 * Velox Dynamic Pricing Engine
 * Computes transparent, real-time ride-sharing fares based on base rates,
 * weather severity, traffic congestion index, and demand-supply surge elasticity.
 */

const RIDE_TIERS = {
    go: {
        id: 'go',
        name: 'Velox Go',
        tagline: 'Affordable, reliable everyday rides',
        icon: 'car',
        baseFare: 3.50,
        perMileRate: 1.65,
        perMinuteRate: 0.35,
        minimumFare: 7.00,
        capacity: '4 seats',
        driverSharePercent: 75
    },
    comfort: {
        id: 'comfort',
        name: 'Velox Comfort',
        tagline: 'Newer cars with extra legroom',
        icon: 'sparkles',
        baseFare: 5.50,
        perMileRate: 2.15,
        perMinuteRate: 0.45,
        minimumFare: 10.00,
        capacity: '4 seats',
        driverSharePercent: 78
    },
    xl: {
        id: 'xl',
        name: 'Velox XL',
        tagline: 'Spacious SUVs for groups & luggage',
        icon: 'truck',
        baseFare: 7.00,
        perMileRate: 2.85,
        perMinuteRate: 0.60,
        minimumFare: 14.00,
        capacity: '6 seats',
        driverSharePercent: 80
    },
    black: {
        id: 'black',
        name: 'Velox Black',
        tagline: 'Premium luxury rides with top-rated chauffeurs',
        icon: 'crown',
        baseFare: 11.00,
        perMileRate: 3.95,
        perMinuteRate: 0.85,
        minimumFare: 22.00,
        capacity: '4 seats',
        driverSharePercent: 82
    }
};

const WEATHER_CONDITIONS = {
    clear: {
        id: 'clear',
        name: 'Clear / Optimal',
        icon: 'sun',
        multiplier: 1.00,
        hazardBonusPerMile: 0.00,
        description: 'Standard road safety. Regular traction and visibility.'
    },
    light_rain: {
        id: 'light_rain',
        name: 'Light Rain / Drizzle',
        icon: 'cloud-drizzle',
        multiplier: 1.15,
        hazardBonusPerMile: 0.20,
        description: 'Slightly reduced grip. +15% safety buffer.'
    },
    heavy_rain: {
        id: 'heavy_rain',
        name: 'Thunderstorm & Torrential Rain',
        icon: 'cloud-lightning',
        multiplier: 1.35,
        hazardBonusPerMile: 0.50,
        description: 'Impaired visibility & hydroplaning hazards. +35% weather premium.'
    },
    snow: {
        id: 'snow',
        name: 'Snow & Icy Roads',
        icon: 'snowflake',
        multiplier: 1.50,
        hazardBonusPerMile: 0.80,
        description: 'Severe traction loss and braking distance. +50% winter hazard rate.'
    },
    heatwave: {
        id: 'heatwave',
        name: 'Extreme Heatwave (>40°C)',
        icon: 'flame',
        multiplier: 1.12,
        hazardBonusPerMile: 0.15,
        description: 'High AC electrical/fuel consumption & engine strain.'
    }
};

const TRAFFIC_LEVELS = {
    low: {
        id: 'low',
        name: 'Free Flow',
        icon: 'zap',
        congestionFactor: 1.00,
        speedFactor: 1.00, // standard baseline duration
        description: 'Open highways and arterial roads with no delays.'
    },
    moderate: {
        id: 'moderate',
        name: 'Moderate Traffic',
        icon: 'navigation',
        congestionFactor: 1.18,
        speedFactor: 1.30, // 30% more time
        description: 'Stop-and-go pockets around city bottlenecks.'
    },
    heavy: {
        id: 'heavy',
        name: 'Rush Hour Congestion',
        icon: 'alert-triangle',
        congestionFactor: 1.45,
        speedFactor: 1.75, // 75% more time
        description: 'Peak commute density, frequent standstill segments.'
    },
    gridlock: {
        id: 'gridlock',
        name: 'Severe Gridlock / Detours',
        icon: 'octagon-alert',
        congestionFactor: 1.80,
        speedFactor: 2.30, // 130% more time
        description: 'Accidents, roadworks, or event closures causing heavy stalls.'
    }
};

/**
 * Algorithmic Anti-Gouging & Protection Caps
 */
const ENGINE_SAFETY_CAPS = {
    MAX_COMBINED_SURGE_MULTIPLIER: 3.50, // Anti-gouging ceiling
    MINIMUM_DRIVER_EARNING_PERCENT: 70   // Floor for driver compensation
};

/**
 * Calculate dynamic pricing based on ride parameters and live environmental metrics
 */
function calculateFare(params) {
    const {
        tierId = 'go',
        distanceMiles = 8.5,
        baseDurationMinutes = 18,
        weatherId = 'clear',
        trafficId = 'moderate',
        demandSupplyRatio = 1.0,
        isEmergencyCapActive = false
    } = params;

    const tier = RIDE_TIERS[tierId] || RIDE_TIERS.go;
    const weather = WEATHER_CONDITIONS[weatherId] || WEATHER_CONDITIONS.clear;
    const traffic = TRAFFIC_LEVELS[trafficId] || TRAFFIC_LEVELS.moderate;

    // Adjusted trip duration factoring traffic slowdown
    const effectiveDurationMinutes = Math.round(baseDurationMinutes * traffic.speedFactor * 10) / 10;

    // 1. Unadjusted Baseline Fare: Base + (Distance * Rate) + (Duration * TimeRate)
    const baseRateSubtotal = tier.baseFare;
    const distanceCost = distanceMiles * tier.perMileRate;
    const timeCost = effectiveDurationMinutes * tier.perMinuteRate;
    const standardTripSubtotal = baseRateSubtotal + distanceCost + timeCost;

    // 2. Weather Surcharge & Multiplier
    const weatherMultiplier = weather.multiplier;
    const weatherHazardBonus = distanceMiles * weather.hazardBonusPerMile;

    // 3. Traffic Congestion Multiplier
    const trafficMultiplier = traffic.congestionFactor;

    // 4. Dynamic Demand/Supply Surge Multiplier
    let rawSurgeMultiplier = 1.0;
    if (demandSupplyRatio > 1.0) {
        rawSurgeMultiplier = 1.0 + Math.pow(demandSupplyRatio - 1.0, 1.15) * 0.85;
    } else if (demandSupplyRatio < 1.0) {
        rawSurgeMultiplier = Math.max(0.85, 1.0 - (1.0 - demandSupplyRatio) * 0.3);
    }
    rawSurgeMultiplier = Math.round(rawSurgeMultiplier * 100) / 100;

    // 5. Total Combined Multiplier with Safety Guardrails
    let combinedMultiplier = weatherMultiplier * trafficMultiplier * rawSurgeMultiplier;
    let antiGougingCapApplied = false;

    if (isEmergencyCapActive) {
        combinedMultiplier = 1.0;
        antiGougingCapApplied = true;
    } else if (combinedMultiplier > ENGINE_SAFETY_CAPS.MAX_COMBINED_SURGE_MULTIPLIER) {
        combinedMultiplier = ENGINE_SAFETY_CAPS.MAX_COMBINED_SURGE_MULTIPLIER;
        antiGougingCapApplied = true;
    }

    combinedMultiplier = Math.round(combinedMultiplier * 100) / 100;

    // 6. Final Fare Computation
    let rawTotalFare = (standardTripSubtotal * combinedMultiplier) + weatherHazardBonus;
    const finalFare = Math.max(tier.minimumFare, Math.round(rawTotalFare * 100) / 100);

    // 7. Driver and Platform Split
    const driverPercentage = tier.driverSharePercent;
    const driverFareBase = (finalFare - weatherHazardBonus) * (driverPercentage / 100);
    const driverTotalPayout = Math.round((driverFareBase + weatherHazardBonus) * 100) / 100;
    const platformTake = Math.round((finalFare - driverTotalPayout) * 100) / 100;
    const effectiveRatePerMile = Math.round((finalFare / Math.max(0.1, distanceMiles)) * 100) / 100;

    return {
        tier,
        weather,
        traffic,
        inputs: {
            distanceMiles,
            baseDurationMinutes,
            effectiveDurationMinutes,
            demandSupplyRatio
        },
        breakdown: {
            baseFare: baseRateSubtotal,
            distanceCost: Math.round(distanceCost * 100) / 100,
            timeCost: Math.round(timeCost * 100) / 100,
            standardTripSubtotal: Math.round(standardTripSubtotal * 100) / 100,
            weatherMultiplier,
            weatherHazardBonus: Math.round(weatherHazardBonus * 100) / 100,
            trafficMultiplier,
            rawSurgeMultiplier,
            combinedMultiplier,
            antiGougingCapApplied
        },
        financials: {
            finalFare,
            effectiveRatePerMile,
            driverPayout: driverTotalPayout,
            platformTake,
            driverSharePercent: Math.round((driverTotalPayout / finalFare) * 100)
        }
    };
}

// Support both browser globals and Node.js
if (typeof window !== 'undefined') {
    window.PricingEngine = {
        RIDE_TIERS,
        WEATHER_CONDITIONS,
        TRAFFIC_LEVELS,
        ENGINE_SAFETY_CAPS,
        calculateFare
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RIDE_TIERS,
        WEATHER_CONDITIONS,
        TRAFFIC_LEVELS,
        ENGINE_SAFETY_CAPS,
        calculateFare
    };
}
