# Central Bank Bonanza 🏛️

> **The Premier Monetary Policy & Macroeconomic Governance Simulator**

Central Bank Bonanza is an institutional-grade macroeconomic simulator designed for central bankers, economists, and strategy enthusiasts. Players take the helm of a sovereign monetary authority to steer inflation, output, employment, and financial stability while navigating unpredictable geopolitical shocks and legislative politics.

---

## 🌟 Key Features

### 1. Dual Play Perspectives
- **First Person Mode ("The Hot Seat")**: You are appointed as Central Bank Chair. Balance the dual mandate (price stability and full employment) while maintaining **Job Security** and **Parliamentary Confidence**. Low approval or repeated legislative reprimands trigger votes of no confidence.
- **God Mode ("The Dynasty of Governors")**: Oversee a succession of central bank chairs across history (*The Pragmatist*, *The Inflation Hawk*, *The Wall Street Whisperer*, *The Labor Champion*). Veteran governors accumulate institutional trust over tenure, anchoring public expectations and dampening market panic.

### 2. Cadence & Quarterly Decision Rhythm
- **Turn Frequency**: 1 month per turn.
- **Months 1 & 2**: Choose **Strategic Silence** or deliver **Forward Guidance** (*Hawkish Warning*, *Dovish Reassurance*, *Data-Dependent Caution*) to shape bond yield curves and equity pricing.
- **Month 3 (Monetary Policy Committee Day)**: The quarterly rate vote. Raise, lower, or hold interest rates in quarter-percent increments:
  $$\{-100\text{ bps}, -75\text{ bps}, -50\text{ bps}, -25\text{ bps}, \text{HOLD } 0\text{ bps}, +25\text{ bps}, +50\text{ bps}, +75\text{ bps}, +100\text{ bps}\}$$

### 3. Monthly Press Dispatches (Difficulty Tiers)
- **Easy**: *Gloomberg News* (macro aggregates & bond yields) & *The Doll Street Journal* (corporate earnings & capitalist perspective).
- **Normal**: Adds *Gotham News Tribune* (housing costs, real wages, labor strikes, living standards).
- **Hard**: Adds *The Cashington Post* (parliamentary oversight, fiscal budget deficit, election clocks).
- **DeepSeek Flash / Local Engine**: Real-time analytical 250–500 word dispatches written without player guidance.

### 4. Embedded Chief of Staff & Economic Advisor
- **Advisory Counsel**: Chat with your Chief of Staff regarding Taylor Rule rate benchmarks, inflation persistence, and yield curve inversion.
- **Parliamentary Legislative Reform**: Draft structural proposals (e.g. *Counter-Cyclical Capital Buffers*, *Housing Refinance Windows*) and send them to Parliament for a 100-seat roll-call vote.
- **Strategic Media Blitz**: Mobilize targeted communication to Wall Street, Main Street, Parliament, or foreign FX desks to anchor expectations.

### 5. 50 Backwards-Planned Causal Events
Built on a verified causal web of **25 positive and 25 negative structural events**, backwards-planned across 253 Level-1 contributing factors and 508 Level-2 sub-factors (`economic_event_web.json` and `economic_event_web.md`).

### 6. Robust Admin Desk
- Inspect and tweak any of the 16+ economic indicators in real time.
- Inject any of the 50 major events as an emergency shock into a live session.
- Configure DeepSeek API keys and model parameters.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd CentralBankBonanza

# Install dependencies
npm install

# Build frontend
npm run build
```

### Running the Application
```bash
# Start full-stack server (serves API on :3001 and built SPA)
npm start

# Or run in development mode (Express server + Vite hot reload)
npm run dev
```

Open your browser at **`http://localhost:3001`** (or `http://localhost:5173` in Vite dev mode).

### Default Credentials
- **Admin**: Username `admin`, Password `centralbank123`
- **Guest Play**: Click "Continue as Guest Governor" on the sign-in modal for zero-friction launch.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Chart.js
- **Backend**: Node.js, Express 5, Better-SQLite3 (WAL mode), dotenv, cors, uuid
- **Architecture**: Directed acyclic causal event graph, New Keynesian IS-Phillips-Taylor macroeconomic model
