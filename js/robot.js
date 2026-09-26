/* ==========================================================================
   MINEXA - Rescue Robot Camera HUD Simulator (Canvas)
   ========================================================================== */

class MinexaRobotCamSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = 400;
    this.height = 180;

    this.mode = 'THERMAL'; // 'THERMAL' or 'OPTICAL'
    this.scanY = 0;
    this.t = 0;

    this.initResize();
  }

  initResize() {
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : null;
      this.width = rect && rect.width ? rect.width : 400;
      this.height = rect && rect.height ? rect.height : 180;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();
    this.startLoop();
  }

  toggleMode() {
    this.mode = this.mode === 'THERMAL' ? 'OPTICAL' : 'THERMAL';
    return this.mode;
  }

  startLoop() {
    const loop = () => {
      this.t += 0.05;
      this.scanY = (this.scanY + 1.2) % this.height;
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'THERMAL') {
      // 1. Thermal background (dark purple/blue base with orange/red gas heat haze)
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0d0221');
      grad.addColorStop(0.5, '#1e053b');
      grad.addColorStop(1, '#080017');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Simulated Tunnel Walls in thermal infrared
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Tunnel perspective grid
      ctx.moveTo(0, 0); ctx.lineTo(w * 0.35, h * 0.4);
      ctx.moveTo(w, 0); ctx.lineTo(w * 0.65, h * 0.4);
      ctx.moveTo(0, h); ctx.lineTo(w * 0.35, h * 0.6);
      ctx.moveTo(w, h); ctx.lineTo(w * 0.65, h * 0.6);
      ctx.stroke();

      // Methane Gas Cloud Heatmap simulation in Zone B center
      const cloudX = w * 0.5 + Math.sin(this.t * 0.8) * 15;
      const cloudY = h * 0.5 + Math.cos(this.t * 0.6) * 10;
      const cloudR = 40 + Math.sin(this.t * 2) * 8;

      const heatGrad = ctx.createRadialGradient(cloudX, cloudY, 5, cloudX, cloudY, cloudR);
      heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      heatGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.6)');
      heatGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.3)');
      heatGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudR, 0, Math.PI * 2);
      ctx.fill();

      // Target lock box on methane anomaly
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      const boxSize = 36;
      ctx.strokeRect(cloudX - boxSize / 2, cloudY - boxSize / 2, boxSize, boxSize);
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('ANOMALY: CH4 LEAK', cloudX - boxSize / 2, cloudY - boxSize / 2 - 4);

    } else {
      // Optical HD night-vision camera
      ctx.fillStyle = '#061a14';
      ctx.fillRect(0, 0, w, h);

      // Night vision grid line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      ctx.fillStyle = '#10b981';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('OPTICAL NV-HD // ILLUMINATOR 100%', 15, 25);
    }

    // 2. Scanline effect moving top to bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, this.scanY, w, 2);

    // 3. Central Target Crosshair
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(cx - 15, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}
