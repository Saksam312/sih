/* ==========================================================================
   MINEXA - Dynamic Sparkline & Telemetry Chart Renderer
   ========================================================================== */

class MinexaChartRenderer {

  // Draw a miniature live sparkline onto a small canvas element
  static drawSparkline(canvas, dataArray, colorHex = '#10b981') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement ? canvas.parentElement.clientWidth || 180 : 180;
    const h = canvas.parentElement ? canvas.parentElement.clientHeight || 36 : 36;
    
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (dataArray.length < 2) return;

    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...dataArray) * 0.95;
    const max = Math.max(...dataArray) * 1.05 || 1;

    const points = dataArray.map((val, idx) => {
      const x = (idx / (dataArray.length - 1)) * w;
      const y = h - ((val - min) / (max - min || 1)) * (h - 8) - 4;
      return { x, y };
    });

    // Draw gradient fill under sparkline
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, this.hexToRgba(colorHex, 0.35));
    fillGrad.addColorStop(1, this.hexToRgba(colorHex, 0.0));

    ctx.beginPath();
    ctx.moveTo(points[0].x, h);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Draw stroke line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw active tip dot
    const lastP = points[points.length - 1];
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(lastP.x, lastP.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw 30-Minute AI Risk Trend Line Chart with Forecast
  static drawAiRiskTrend(canvas, historicalData, forecastData) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement ? canvas.parentElement.clientWidth || 300 : 300;
    const h = 110;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    // Grid lines & Y-axis scale (0 - 100%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    [25, 50, 75].forEach(pct => {
      const y = h - (pct / 100) * (h - 20) - 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${pct}%`, 4, y - 2);
    });

    const totalPoints = historicalData.length + forecastData.length;

    // Map historical points
    const histPts = historicalData.map((val, idx) => {
      const x = (idx / (totalPoints - 1)) * w;
      const y = h - (val / 100) * (h - 20) - 10;
      return { x, y, val };
    });

    // Map forecast points
    const forePts = forecastData.map((val, idx) => {
      const x = ((historicalData.length - 1 + idx) / (totalPoints - 1)) * w;
      const y = h - (val / 100) * (h - 20) - 10;
      return { x, y, val };
    });

    // Draw Historical Area Gradient
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    ctx.beginPath();
    ctx.moveTo(histPts[0].x, h);
    histPts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(histPts[histPts.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Historical Solid Line
    ctx.beginPath();
    ctx.moveTo(histPts[0].x, histPts[0].y);
    histPts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // AI Forecast Dashed Line (Projection)
    if (forePts.length > 0) {
      ctx.beginPath();
      ctx.moveTo(histPts[histPts.length - 1].x, histPts[histPts.length - 1].y);
      forePts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Divider line between Now and AI Projection
    const splitX = histPts[histPts.length - 1].x;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillText('NOW', splitX - 12, h - 2);
    ctx.fillText('AI FORECAST +15m', splitX + 5, h - 2);
  }

  static hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
}
