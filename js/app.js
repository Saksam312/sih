/* ==========================================================================
   MINEXA - Underground Mine Safety Command Center
   Main Application Logic, Telemetry Simulation & State Manager
   ========================================================================== */

class MinexaApp {
  constructor() {
    this.currentScenario = 'high_risk'; // 'high_risk', 'normal', 'warning', 'critical'
    
    // Core 8 Sensors Telemetry State
    this.sensors = {
      'O2': {
        id: 'O2',
        name: 'O₂ – Oxygen',
        symbol: 'O₂',
        icon: 'wind',
        value: 20.6,
        unit: '%',
        minSafe: 19.5,
        maxSafe: 23.5,
        rangeStr: '19.5% - 23.5%',
        status: 'NORMAL',
        history: [20.5, 20.4, 20.2, 20.1, 20.5, 20.6, 20.6]
      },
      'CH4': {
        id: 'CH4',
        name: 'CH₄ – Methane',
        symbol: 'CH₄',
        icon: 'flame',
        value: 1.44,
        unit: '%',
        minSafe: 0,
        maxSafe: 1.0,
        rangeStr: '< 1.0%',
        status: 'WARNING',
        history: [0.2, 0.4, 0.7, 1.0, 1.2, 1.35, 1.44]
      },
      'CO2': {
        id: 'CO2',
        name: 'CO₂ – Carbon Dioxide',
        symbol: 'CO₂',
        icon: 'cloud-rain',
        value: 1.09,
        unit: '%',
        minSafe: 0,
        maxSafe: 0.5,
        rangeStr: '< 0.5%',
        status: 'NORMAL',
        history: [0.7, 0.8, 0.9, 1.0, 1.05, 1.08, 1.09]
      },
      'CO': {
        id: 'CO',
        name: 'CO – Carbon Monoxide',
        symbol: 'CO',
        icon: 'skull',
        value: 61.64,
        unit: 'ppm',
        minSafe: 0,
        maxSafe: 25,
        rangeStr: '< 25 ppm',
        status: 'WARNING',
        history: [18, 22, 30, 42, 54, 58, 61.64]
      },
      'TEMP': {
        id: 'TEMP',
        name: 'Temperature',
        symbol: 'Temp',
        icon: 'thermometer',
        value: 52,
        unit: '°C',
        minSafe: 18.0,
        maxSafe: 28.0,
        rangeStr: '18°C - 28°C',
        status: 'WARNING',
        history: [29, 34, 38, 44, 48, 50, 52]
      },
      'HUM': {
        id: 'HUM',
        name: 'Humidity',
        symbol: 'Hum',
        icon: 'droplets',
        value: 64.1,
        unit: '%',
        minSafe: 30,
        maxSafe: 70,
        rangeStr: '30% - 70%',
        status: 'NORMAL',
        history: [60, 61, 62, 63, 64, 64.1, 64.1]
      },
      'FLOW': {
        id: 'FLOW',
        name: 'Airflow Velocity',
        symbol: 'Flow',
        icon: 'fan',
        value: 13.91,
        unit: 'm/s',
        minSafe: 1.2,
        maxSafe: 5.0,
        rangeStr: '> 1.2 m/s',
        status: 'WARNING',
        history: [8, 9, 10, 11.5, 12.8, 13.5, 13.91]
      },
      'SMOKE': {
        id: 'SMOKE',
        name: 'Smoke Density',
        symbol: 'Smoke',
        icon: 'cloud',
        value: 14.21,
        unit: 'FTU',
        minSafe: 0,
        maxSafe: 50,
        rangeStr: '< 50 FTU',
        status: 'NORMAL',
        history: [4, 5, 7, 9, 11, 13, 14.21]
      }
    };

    // Workers State (UWB Tracking)
    this.workers = [
      { id: 'Worker W01', name: 'Alex Mercer', role: 'Driller', zone: 'Zone A', relX: 0.16, relY: 0.45, distanceStr: '18 m from hazard', status: 'SAFE', heartRate: 76 },
      { id: 'Worker W02', name: 'Dave Vance', role: 'Blaster', zone: 'Zone B', relX: 0.38, relY: 0.28, distanceStr: '6 m from hazard', status: 'AT RISK', heartRate: 114 },
      { id: 'Worker W03', name: 'Elena Rostova', role: 'Engineer', zone: 'Zone C', relX: 0.72, relY: 0.25, distanceStr: '35 m from hazard', status: 'SAFE', heartRate: 82 }
    ];

    // Rescue Robot State
    this.robot = {
      id: 'MINEXA Scout-V',
      zone: 'Zone B',
      relX: 0.44,
      relY: 0.34,
      battery: 84,
      status: 'ACTIVE',
      camera: 'HD Thermal + Optical',
      inspectionTask: 'Gas Sniffing & Wall Scan'
    };

    // Safety Alerts Stream
    this.alerts = [
      { id: 'ALT-101', time: '14:02:45', zone: 'Zone B', hazard: 'CH₄ Methane Accumulation High (0.8% → 1.4%)', severity: 'CRITICAL', rec: 'Dispatch Vent Fan #2 & Evacuate Zone B', ack: false },
      { id: 'ALT-102', time: '14:01:10', zone: 'Zone C', hazard: 'Low Airflow Velocity (0.8 m/s)', severity: 'WARNING', rec: 'Inspect Auxiliary Blower #3 Dampers', ack: false },
      { id: 'ALT-103', time: '13:58:30', zone: 'Zone A', hazard: 'Stope Temperature Rising (31.4°C)', severity: 'WARNING', rec: 'Check Main Cooling Manifold Flow Rate', ack: false }
    ];

    // AI Historical Risk Data (30 mins history + 15 mins forecast)
    this.riskHistory = [28, 30, 32, 35, 42, 50, 64, 72];
    this.riskForecast = [78, 81, 84];

    this.mapRenderer = null;
    this.robotCam = null;

    this.init();
  }

  init() {
    this.startClock();
    this.renderSensorsGrid();
    this.updateRiskCard(72, 'HIGH RISK');
    this.renderWorkerTable();
    this.renderAlertsList();

    // Initialize Canvas Renderers after DOM is loaded
    setTimeout(() => {
      this.mapRenderer = new MinexaMapRenderer('mineMapCanvas');
      this.robotCam = new MinexaRobotCamSimulator('robotCamCanvas');
      
      this.mapRenderer.updateEntities(this.workers, this.robot);
      this.updateSparklinesAndCharts();
      
      // Lucide SVG Icon initialization
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);

    // Live Telemetry Loop (every 2.5 seconds)
    setInterval(() => this.liveTelemetryTick(), 2500);
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toISOString().split('T')[0] + ' UTC';

      const timeEl = document.getElementById('liveTime');
      const dateEl = document.getElementById('liveDate');
      if (timeEl) timeEl.textContent = timeStr;
      if (dateEl) dateEl.textContent = dateStr;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // Live Telemetry Jitter Simulation
  liveTelemetryTick() {
    // Add small realistic fluctuation to values
    Object.keys(this.sensors).forEach(key => {
      const s = this.sensors[key];
      let delta = (Math.random() - 0.48) * (s.unit === '%' ? 0.04 : 1.2);
      s.value = Math.max(0, +(s.value + delta).toFixed(2));
      s.history.shift();
      s.history.push(s.value);
    });

    // Worker minor motion simulation
    this.workers.forEach(w => {
      w.relX += (Math.random() - 0.5) * 0.005;
      w.relY += (Math.random() - 0.5) * 0.005;
    });

    // Robot path patrol simulation
    if (this.robot.status === 'ACTIVE') {
      this.robot.relX += (Math.random() - 0.5) * 0.008;
    }

    // Refresh UI Components
    this.renderSensorsGridValuesOnly();
    this.renderWorkerTable();
    this.updateSparklinesAndCharts();

    if (this.mapRenderer) {
      this.mapRenderer.updateEntities(this.workers, this.robot);
    }
  }

  // Render 8 Sensor Cards Grid
  renderSensorsGrid() {
    const container = document.getElementById('sensorsGrid');
    if (!container) return;

    container.innerHTML = Object.values(this.sensors).map(s => {
      const statusClass = s.status === 'NORMAL' ? 'status-normal' : s.status === 'WARNING' ? 'status-warning' : 'status-critical';
      const badgeClass = s.status === 'NORMAL' ? 'status-badge-normal' : s.status === 'WARNING' ? 'status-badge-warning' : 'status-badge-critical';

      return `
        <div class="sensor-card ${statusClass}" id="sensor-card-${s.id}">
          <div class="sensor-header">
            <div class="sensor-name-wrap">
              <div class="sensor-icon"><i data-lucide="${s.icon}"></i></div>
              <span class="sensor-name">${s.name}</span>
            </div>
            <span class="sensor-status-badge ${badgeClass}" id="sensor-badge-${s.id}">${s.status}</span>
          </div>

          <div class="sensor-body">
            <div class="sensor-value-group">
              <span class="sensor-value" id="sensor-val-${s.id}">${s.value}</span>
              <span class="sensor-unit">${s.unit}</span>
            </div>
            <div class="sensor-range">Safe: ${s.rangeStr}</div>
          </div>

          <div class="sensor-sparkline-wrap">
            <canvas class="sparkline-canvas" id="sparkline-${s.id}"></canvas>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderSensorsGridValuesOnly() {
    Object.values(this.sensors).forEach(s => {
      const valEl = document.getElementById(`sensor-val-${s.id}`);
      if (valEl) valEl.textContent = s.value;
    });
  }

  updateSparklinesAndCharts() {
    // Draw 8 sparklines
    Object.values(this.sensors).forEach(s => {
      const cvs = document.getElementById(`sparkline-${s.id}`);
      const color = s.status === 'NORMAL' ? '#10b981' : s.status === 'WARNING' ? '#f59e0b' : '#ef4444';
      MinexaChartRenderer.drawSparkline(cvs, s.history, color);
    });

    // Draw AI Risk Trend chart
    const trendCvs = document.getElementById('aiTrendCanvas');
    MinexaChartRenderer.drawAiRiskTrend(trendCvs, this.riskHistory, this.riskForecast);
  }

  // Update Overall Risk Gauge & Text
  updateRiskCard(score, statusStr) {
    const progressEl = document.getElementById('gaugeProgress');
    const scoreEl = document.getElementById('gaugeScoreValue');
    const statusEl = document.getElementById('gaugeStatusText');

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (statusEl) {
      statusEl.textContent = statusStr;
      const nextClass = `gauge-status status-${statusStr.toLowerCase().replace(' ', '-')}`;
      statusEl.setAttribute('class', nextClass);
    }

    // Gauge circular arc calculation (stroke-dasharray 377)
    if (progressEl) {
      const offset = 377 - (377 * 0.75 * (score / 100));
      progressEl.style.strokeDashoffset = offset;
    }

    // Highlight active risk step bar
    ['stepSafe', 'stepWarning', 'stepHigh', 'stepCritical'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    if (score <= 30) document.getElementById('stepSafe')?.classList.add('active');
    else if (score <= 60) document.getElementById('stepWarning')?.classList.add('active');
    else if (score <= 85) document.getElementById('stepHigh')?.classList.add('active');
    else document.getElementById('stepCritical')?.classList.add('active');

    // Update AI Card values
    const aiCur = document.getElementById('aiCurrentRisk');
    if (aiCur) aiCur.textContent = `${score}%`;
  }

  // Render Worker Table
  renderWorkerTable() {
    const tbody = document.getElementById('workerTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.workers.map(w => {
      const isAtRisk = w.status === 'AT RISK' || w.status === 'CRITICAL';
      const statusPillClass = isAtRisk ? 'at-risk' : 'safe';

      return `
        <tr style="cursor:pointer;" onclick="window.minexaApp.openWorkerModal('${w.id}')">
          <td class="worker-id-cell"><i data-lucide="user" style="width:12px; height:12px;"></i> ${w.id}</td>
          <td>${w.zone}</td>
          <td style="font-family: var(--font-mono); font-size: 0.72rem;">X:${Math.round(w.relX * 400)} Y:${Math.round(w.relY * 200)}</td>
          <td>${w.distanceStr}</td>
          <td><span class="status-pill-sm ${statusPillClass}">${w.status}</span></td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Render Alerts List
  renderAlertsList() {
    const list = document.getElementById('alertsList');
    if (!list) return;

    list.innerHTML = this.alerts.map(a => {
      const isCrit = a.severity === 'CRITICAL';
      const itemClass = isCrit ? 'sev-critical' : 'sev-warning';
      const tagClass = isCrit ? 'critical' : 'warning';
      const ackClass = a.ack ? 'acknowledged' : '';

      return `
        <div class="alert-item ${itemClass} ${ackClass}" id="alert-item-${a.id}">
          <div class="alert-left-meta">
            <div class="alert-icon-wrap">${isCrit ? '🚨' : '⚠️'}</div>
            <div class="alert-details">
              <div class="alert-header-line">
                <span class="alert-sev-tag ${tagClass}">${a.severity}</span>
                <span class="alert-time">${a.time}</span>
                <span class="alert-zone">${a.zone}</span>
              </div>
              <div class="alert-hazard-title">${a.hazard}</div>
              <div class="alert-recommendation"><strong>Rec:</strong> ${a.rec}</div>
            </div>
          </div>

          <div class="alert-buttons">
            <button class="btn btn-xs ${a.ack ? 'btn-dark' : 'btn-amber'}" onclick="window.minexaApp.acknowledgeAlert('${a.id}')">
              ${a.ack ? '<i data-lucide="check"></i> Ack\'d' : 'ACKNOWLEDGE'}
            </button>
            <button class="btn btn-xs btn-dark" onclick="window.minexaApp.viewAlertLocation('${a.zone}')">
              VIEW LOCATION
            </button>
            <button class="btn btn-xs btn-red" onclick="window.minexaApp.escalateAlert('${a.id}')">
              ESCALATE
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Alert Button Actions
  acknowledgeAlert(id) {
    const alertObj = this.alerts.find(a => a.id === id);
    if (alertObj) {
      alertObj.ack = true;
      this.renderAlertsList();
      window.minexaAudio.playBeep(440, 0.1, 'sine');
    }
  }

  clearAcknowledgedAlerts() {
    this.alerts = this.alerts.filter(a => !a.ack);
    this.renderAlertsList();
  }

  viewAlertLocation(zone) {
    window.minexaAudio.playBeep(880, 0.1, 'sine');
    alert(`Map Centered on ${zone}. Visual Inspection Highlighted.`);
  }

  escalateAlert(id) {
    window.minexaAudio.startEmergencySiren();
    this.triggerEmergencyEvac();
  }

  // Scenario Changer (Simulations)
  changeScenario(scen) {
    this.currentScenario = scen;

    if (scen === 'high_risk') {
      this.updateRiskCard(72, 'HIGH RISK');
      this.sensors['CH4'].value = 0.8;
      this.sensors['CH4'].status = 'WARNING';
      this.sensors['O2'].value = 19.8;
      this.sensors['CO'].value = 38;
      this.sensors['TEMP'].value = 31.4;
      this.sensors['FLOW'].value = 0.8;
      this.workers[1].status = 'AT RISK';
      this.riskForecast = [78, 84];
    } else if (scen === 'normal') {
      this.updateRiskCard(18, 'SAFE');
      this.sensors['CH4'].value = 0.2;
      this.sensors['CH4'].status = 'NORMAL';
      this.sensors['O2'].value = 20.9;
      this.sensors['CO'].value = 8;
      this.sensors['TEMP'].value = 24.0;
      this.sensors['FLOW'].value = 2.1;
      this.workers[1].status = 'SAFE';
      this.riskForecast = [18, 16];
    } else if (scen === 'critical') {
      this.updateRiskCard(94, 'CRITICAL');
      this.sensors['CH4'].value = 1.8;
      this.sensors['CH4'].status = 'CRITICAL';
      this.sensors['O2'].value = 18.2;
      this.sensors['O2'].status = 'CRITICAL';
      this.sensors['CO'].value = 65;
      this.sensors['CO'].status = 'CRITICAL';
      this.sensors['TEMP'].value = 36.5;
      this.sensors['TEMP'].status = 'CRITICAL';
      this.workers.forEach(w => w.status = 'AT RISK');
      this.riskForecast = [96, 99];
      window.minexaAudio.startEmergencySiren();
    }

    this.renderSensorsGrid();
    this.renderWorkerTable();
    this.updateSparklinesAndCharts();
  }

  // Audio Mute Toggle
  toggleSound() {
    const isMuted = window.minexaAudio.toggleMute();
    const icon = document.getElementById('soundIcon');
    if (icon) {
      icon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Emergency Modal Controls
  triggerEmergencyEvac() {
    window.minexaAudio.startEmergencySiren();
    const modal = document.getElementById('emergencyModal');
    if (modal) modal.classList.remove('hidden');
  }

  dismissEmergencyModal() {
    window.minexaAudio.stopEmergencySiren();
    const modal = document.getElementById('emergencyModal');
    if (modal) modal.classList.add('hidden');
  }

  confirmFullEvacuation() {
    alert("CRITICAL: FULL MINE EVACUATION SIRENS ENGAGED. RESCUE TEAMS NOTIFIED.");
    this.dismissEmergencyModal();
  }

  // Robot controls
  toggleRobotCamMode() {
    if (this.robotCam) {
      const newMode = this.robotCam.toggleMode();
      const status = document.getElementById('robotCamStatus');
      if (status) status.textContent = `Mode: ${newMode}`;
    }
  }

  dispatchRobotToZone(zone) {
    this.robot.zone = `Zone ${zone}`;
    const txt = document.getElementById('robotZone');
    if (txt) txt.textContent = `Zone ${zone}`;
    window.minexaAudio.playBeep(700, 0.15, 'sine');
  }

  robotGasSniff() {
    alert("Robot Gas Sniffer Deployed. Sampling air quality at Zone B extraction face.");
  }

  // Worker Modal
  openWorkerModal(wId) {
    const w = this.workers.find(item => item.id === wId);
    if (!w) return;

    const modal = document.getElementById('workerModal');
    const title = document.getElementById('modalWorkerTitle');
    const body = document.getElementById('modalWorkerBody');

    if (title) title.textContent = `${w.id} - ${w.name} (${w.role})`;
    if (body) {
      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div><strong>Current Location:</strong> ${w.zone} (UWB Tag Active)</div>
          <div><strong>Heart Rate Biosensor:</strong> <span class="text-amber">${w.heartRate} BPM (Elevated)</span></div>
          <div><strong>Distance to Hazard Face:</strong> ${w.distanceStr}</div>
          <div><strong>Equipment Status:</strong> SCBA Respirator OK, Cap Lamp Battery 92%</div>
          <div><strong>Safety Recommendation:</strong> ${w.status === 'AT RISK' ? 'Evacuate immediately to Refuge Chamber D' : 'Operations normal, stay on comms channel 4'}</div>
        </div>
      `;
    }
    if (modal) modal.classList.remove('hidden');
  }

  closeWorkerModal() {
    const modal = document.getElementById('workerModal');
    if (modal) modal.classList.add('hidden');
  }

  resetMapView() {
    if (this.mapRenderer) {
      this.mapRenderer.updateEntities(this.workers, this.robot);
    }
  }
}

// Instantiate global app instance
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.minexaApp = new MinexaApp();
  });
} else {
  window.minexaApp = new MinexaApp();
}
