/* ==========================================================================
   MINEXA - Interactive Underground Mine Map Canvas Renderer
   ========================================================================== */

class MinexaMapRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.width = 0;
    this.height = 0;
    this.animFrame = null;

    // Map data structures
    this.zones = {
      'A': { id: 'A', name: 'Zone A - Shaft Access', status: 'SAFE', color: '#10b981', bgAlpha: 0.12, rect: { x: 0.05, y: 0.15, w: 0.22, h: 0.7 } },
      'B': { id: 'B', name: 'Zone B - Extract Stope 1', status: 'HIGH RISK', color: '#ef4444', bgAlpha: 0.35, rect: { x: 0.32, y: 0.15, w: 0.24, h: 0.38 } },
      'C': { id: 'C', name: 'Zone C - Deep Stope 2', status: 'WARNING', color: '#f59e0b', bgAlpha: 0.18, rect: { x: 0.60, y: 0.15, w: 0.35, h: 0.38 } },
      'D': { id: 'D', name: 'Zone D - Refuge Chamber', status: 'SAFE', color: '#10b981', bgAlpha: 0.12, rect: { x: 0.45, y: 0.60, w: 0.45, h: 0.25 } }
    };

    // Tunnel paths (connecting vectors)
    this.tunnels = [
      { from: { x: 0.16, y: 0.10 }, to: { x: 0.16, y: 0.85 }, label: 'Main Shaft Tunnel' },
      { from: { x: 0.16, y: 0.34 }, to: { x: 0.85, y: 0.34 }, label: 'Level 1 Haulage Way' },
      { from: { x: 0.16, y: 0.72 }, to: { x: 0.85, y: 0.72 }, label: 'Level 2 Deep Access' },
      { from: { x: 0.44, y: 0.34 }, to: { x: 0.44, y: 0.72 }, label: 'Cross-Cut 1' },
      { from: { x: 0.75, y: 0.34 }, to: { x: 0.75, y: 0.72 }, label: 'Ventilation Shaft 2' }
    ];

    // Fixed sensor node locations
    this.sensors = [
      { id: 'S01', type: 'O2/CH4', zone: 'A', relX: 0.16, relY: 0.25, status: 'NORMAL' },
      { id: 'S02', type: 'CH4/CO', zone: 'B', relX: 0.40, relY: 0.28, status: 'WARNING' },
      { id: 'S03', type: 'Temp/Air', zone: 'B', relX: 0.48, relY: 0.34, status: 'CRITICAL' },
      { id: 'S04', type: 'Airflow', zone: 'C', relX: 0.68, relY: 0.25, status: 'WARNING' },
      { id: 'S05', type: 'O2/CO2', zone: 'C', relX: 0.82, relY: 0.34, status: 'NORMAL' },
      { id: 'S06', type: 'Smoke/O2', zone: 'D', relX: 0.55, relY: 0.72, status: 'NORMAL' },
      { id: 'S07', type: 'Temp/Hum', zone: 'D', relX: 0.78, relY: 0.72, status: 'NORMAL' }
    ];

    // Dynamic Entities
    this.workers = [];
    this.robot = { id: 'MINEXA Scout-V', zone: 'B', relX: 0.44, relY: 0.34, status: 'ACTIVE' };

    this.pulseTime = 0;
    this.initResize();
  }

  initResize() {
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = rect.width || 600;
      this.height = rect.height || 380;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();
    this.startAnimation();
  }

  updateEntities(workers, robot, zonesStatus) {
    this.workers = workers;
    if (robot) this.robot = robot;
    if (zonesStatus) {
      Object.keys(zonesStatus).forEach(zKey => {
        if (this.zones[zKey]) {
          this.zones[zKey].status = zonesStatus[zKey].status;
          this.zones[zKey].color = zonesStatus[zKey].color;
        }
      });
    }
  }

  startAnimation() {
    const render = () => {
      this.pulseTime += 0.04;
      this.draw();
      this.animFrame = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx || this.width === 0) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw grid lines (tactical background)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 1. Draw Zones (Bounding areas & heat overlays)
    Object.values(this.zones).forEach(zone => {
      const zx = zone.rect.x * w;
      const zy = zone.rect.y * h;
      const zw = zone.rect.w * w;
      const zh = zone.rect.h * h;

      let fillAlpha = zone.bgAlpha;
      let strokeColor = zone.color;

      // Pulsing effect for hazard/critical zones
      if (zone.status === 'HIGH RISK' || zone.status === 'CRITICAL') {
        fillAlpha = 0.25 + Math.sin(this.pulseTime * 4) * 0.12;
      }

      ctx.fillStyle = this.hexToRgba(strokeColor, fillAlpha);
      ctx.fillRect(zx, zy, zw, zh);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(zx, zy, zw, zh);
      ctx.setLineDash([]);

      // Zone Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(zone.name.toUpperCase(), zx + 8, zy + 18);

      // Status pill
      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`[ ${zone.status} ]`, zx + 8, zy + 32);
    });

    // 2. Draw Mine Tunnels (Connecting corridors)
    this.tunnels.forEach(t => {
      const fx = t.from.x * w;
      const fy = t.from.y * h;
      const tx = t.to.x * w;
      const ty = t.to.y * h;

      // Outer glow tunnel
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Inner tunnel track
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Center dash line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Draw Fixed Sensor Nodes
    this.sensors.forEach(s => {
      const sx = s.relX * w;
      const sy = s.relY * h;

      let color = s.status === 'CRITICAL' ? '#ef4444' : s.status === 'WARNING' ? '#f59e0b' : '#10b981';

      // Blinking ring
      const ringR = 6 + Math.sin(this.pulseTime * 3) * 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Core dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${s.id}`, sx + 6, sy + 3);
    });

    // 4. Draw Workers (Blue dots with UWB rings)
    this.workers.forEach(wItem => {
      const wx = wItem.relX * w;
      const wy = wItem.relY * h;

      const isAtRisk = wItem.status === 'AT RISK' || wItem.status === 'CRITICAL';
      const wColor = isAtRisk ? '#ef4444' : '#3b82f6';

      // UWB Pulse ring
      const uwbRadius = 12 + Math.sin(this.pulseTime * 5 + wItem.id.charCodeAt(1)) * 4;
      ctx.strokeStyle = this.hexToRgba(wColor, 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wx, wy, uwbRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Worker Dot
      ctx.fillStyle = wColor;
      ctx.beginPath();
      ctx.arc(wx, wy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Worker Inner Core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(wx, wy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Worker Label Tag
      ctx.fillStyle = isAtRisk ? '#ef4444' : '#60a5fa';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`${wItem.id}`, wx + 8, wy - 4);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${wItem.distanceStr}`, wx + 8, wy + 6);
    });

    // 5. Draw Rescue Robot (Purple Icon / Quad Rover)
    if (this.robot) {
      const rx = this.robot.relX * w;
      const ry = this.robot.relY * h;

      // Robot scanner arc rotation
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(this.pulseTime * 1.5);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 0.8);
      ctx.stroke();
      ctx.restore();

      // Robot icon box
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R1', rx, ry + 3);
      ctx.textAlign = 'left';

      // Tag
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText('SCOUT-V', rx + 10, ry + 3);
    }
  }

  hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
}
