# Velox Dynamic Pricing Engine 🚗⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-brightgreen.svg)](#deploy-to-github-pages)
[![Stack: Vanilla JS + Tailwind](https://img.shields.io/badge/Tech-HTML5%20%7C%20Tailwind%20%7C%20Chart.js-0284c7.svg)](#technology-stack)
[![Zero Build Setup](https://img.shields.io/badge/Dependencies-Zero%20Build-emerald.svg)](#local-preview)

> An interactive algorithmic pricing model and simulation dashboard for **Velox**, a fictional next-generation ride-sharing platform. Demonstrates how real-time **weather conditions**, **traffic gridlock**, and **demand/supply elasticity** dynamically compute ride fares with mathematical transparency and ethical anti-gouging safeguards.

---

## 📸 Overview & Features

- 🎛️ **Interactive Pricing Simulator**: Adjust route distance, trip duration, meteorological conditions, traffic density, and market demand in real-time.
- 🌦️ **Dynamic Weather Surcharge Matrix**: Models 5 distinct weather conditions (Clear, Light Rain, Heavy Thunderstorm, Snow/Ice, Heatwave) with dedicated driver hazard stipends.
- 🚦 **Traffic Congestion Index**: Simulates travel speed lag (Free Flow, Moderate Delay, Rush Hour, Severe Gridlock) with duration auto-scaling.
- 📈 **Price Elasticity Curve (Chart.js)**: Live graph illustrating how fare dynamically scales against rider-to-driver supply ratios.
- 🗺️ **Canvas Route & Meteorological Visualizer**: High-performance HTML5 Canvas rendering city streets, GPS vehicle tracking, congestion colors, and atmospheric particle systems (falling rain, snow, lightning, heat ripple).
- 🛡️ **Ethical Anti-Gouging Caps**: Hard stops preventing unfair price gouging ($3.50\times$ surge ceiling) and a statutory **Emergency Price Freeze** toggle for natural disasters.
- 💵 **Transparent Fare Ledger**: Real-time breakdown of base flagdrop, mileage rate, duration cost, driver payout share (75%–82%), and platform take-rate.
- ⚡ **Zero-Build Architecture**: Runs straight in the browser using standard ES Modules, Tailwind CSS CDN, Lucide Icons, and Chart.js. 100% ready for **GitHub Pages**.

---

## 📐 Mathematical Formulation

The dynamic pricing algorithm calculates fare $F$ using deterministic components:

$$F = \max\left( F_{\text{min}}, \; \Big[ F_{\text{base}} + (d \cdot R_{\text{dist}}) + (t_{\text{eff}} \cdot R_{\text{time}}) \Big] \times M_{\text{net}} + B_{\text{hazard}} \right)$$

### Where:

1. **Baseline Standard Cost**:
   - $F_{\text{base}}$: Flagdrop starting fare by vehicle tier (e.g., $\$3.50$ for Velox Go).
   - $d \cdot R_{\text{dist}}$: Trip distance in miles multiplied by tier mileage rate ($\$1.65$/mi).
   - $t_{\text{eff}} \cdot R_{\text{time}}$: Traffic-adjusted duration in minutes multiplied by per-minute rate ($\$0.35$/min), where $t_{\text{eff}} = t_{\text{base}} \times S_{\text{traffic}}$.

2. **Net Dynamic Multiplier ($M_{\text{net}}$)**:
   $$M_{\text{net}} = \min\big( M_{\text{weather}} \times M_{\text{traffic}} \times M_{\text{surge}}, \; 3.50 \big)$$
   *(Surge is capped at $1.00\times$ when the Emergency Price Freeze is activated).*

3. **Weather Hazard Bonus ($B_{\text{hazard}}$)**:
   $$B_{\text{hazard}} = d \times H_{\text{weather}}$$
   *Passed 100% directly to drivers to compensate for perilous road conditions (e.g., $+\$0.50$/mi during thunderstorms, $+\$0.80$/mi in snow).*

---

## 📁 Project Structure

```text
craft01/
├── index.html            # Main application UI, dashboard, and modal specs
├── css/
│   └── styles.css        # Glassmorphism, animations, custom sliders & styling
├── js/
│   ├── app.js            # Main application controller, event binding & Chart.js
│   ├── pricingEngine.js  # Algorithmic pricing calculations & tier configs
│   └── mapVisualizer.js  # Canvas animation for routes, cars & weather particles
├── LICENSE               # MIT Open Source License
├── .gitignore            # Git exclusion rules
└── README.md             # Documentation, mathematical formulation & setup
```

---

## 🚀 Local Preview

Because this project uses native browser ES Modules, run it using any lightweight local server:

### Python 3:
```bash
python -m http.server 3000
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

### Node.js (npx):
```bash
npx serve .
```

### VS Code:
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🌐 Deploy to GitHub Pages (Step-by-Step)

1. **Initialize Git & Commit**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Velox Dynamic Pricing Engine"
   ```

2. **Create a new GitHub Repository**:
   - Go to [github.com/new](https://github.com/new).
   - Name it `dynamic-pricing-engine` (or your preferred name).
   - Leave it public and do not initialize with a README (already present).

3. **Link Remote and Push**:
   ```bash
   git remote add origin https://github.com/<your-username>/dynamic-pricing-engine.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - In your GitHub repo, go to **Settings** > **Pages** (left sidebar).
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
   - Your live site will be published at `https://<your-username>.github.io/dynamic-pricing-engine/` within 60 seconds!

---

## 🛡️ Ethical Guardrails & Anti-Gouging

1. **Ceiling Cap**: Algorithmic multiplier is strictly capped at $3.50\times$ under peak commercial load.
2. **Emergency Safeguard**: Instantly freezes surge multipliers to $1.00\times$ during declared emergencies while retaining minimum baseline driver safety stipends.
3. **Driver Equity**: Drivers receive between 75% to 82% of the fare, plus 100% of weather hazard fees.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use, modify, and study for educational or commercial simulation purposes.
