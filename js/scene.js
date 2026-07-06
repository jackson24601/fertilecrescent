(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let time = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    gradient.addColorStop(0, "#1a2848");
    gradient.addColorStop(0.25, "#4a3060");
    gradient.addColorStop(0.45, "#c06040");
    gradient.addColorStop(0.65, "#e8a050");
    gradient.addColorStop(0.85, "#f0c070");
    gradient.addColorStop(1, "#d4a060");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawSun() {
    const sunX = width * 0.72;
    const sunY = height * 0.28;
    const sunRadius = Math.min(width, height) * 0.07;

    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 4);
    glow.addColorStop(0, "rgba(255, 220, 140, 0.5)");
    glow.addColorStop(0.4, "rgba(255, 180, 80, 0.2)");
    glow.addColorStop(1, "rgba(255, 140, 40, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunRadius * 4, sunY - sunRadius * 4, sunRadius * 8, sunRadius * 8);

    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGrad.addColorStop(0, "#fff8e0");
    sunGrad.addColorStop(0.6, "#ffd060");
    sunGrad.addColorStop(1, "#e08030");
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();
  }

  function drawDistantMountains() {
    ctx.fillStyle = "rgba(80, 50, 30, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    for (let x = 0; x <= width; x += width / 8) {
      const peak = height * (0.42 + Math.sin(x * 0.008 + 1) * 0.06 + Math.cos(x * 0.015) * 0.04);
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(width, height * 0.6);
    ctx.lineTo(0, height * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  function drawDesertBase() {
    const gradient = ctx.createLinearGradient(0, height * 0.45, 0, height);
    gradient.addColorStop(0, "#c89850");
    gradient.addColorStop(0.3, "#b88040");
    gradient.addColorStop(0.6, "#a06830");
    gradient.addColorStop(1, "#885828");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);
  }

  function drawDunes() {
    const dunes = [
      { base: 0.52, amp: 0.04, freq: 0.006, phase: 0, color: "rgba(180, 130, 70, 0.5)" },
      { base: 0.58, amp: 0.05, freq: 0.004, phase: 2, color: "rgba(160, 110, 55, 0.45)" },
      { base: 0.65, amp: 0.06, freq: 0.005, phase: 4, color: "rgba(140, 95, 45, 0.4)" },
      { base: 0.72, amp: 0.04, freq: 0.007, phase: 1, color: "rgba(120, 80, 38, 0.35)" },
    ];

    dunes.forEach((dune) => {
      ctx.fillStyle = dune.color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 4) {
        const y =
          height * dune.base +
          Math.sin(x * dune.freq + dune.phase) * height * dune.amp +
          Math.sin(x * dune.freq * 2.3 + dune.phase * 1.5) * height * dune.amp * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    });
  }

  function getRiverPath(side) {
    const points = [];
    const segments = 80;
    const startX = side === "left" ? width * 0.15 : width * 0.85;
    const endX = width * 0.5;
    const startY = height * 0.35;
    const endY = height * 0.75;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const curve =
        Math.sin(t * Math.PI * 2.5 + (side === "left" ? 0 : Math.PI)) * width * 0.08 +
        Math.sin(t * Math.PI * 5 + (side === "left" ? 1 : 3)) * width * 0.03;
      const y = startY + (endY - startY) * t + curve * (side === "left" ? 1 : -1) * 0.3;
      points.push({ x, y });
    }
    return points;
  }

  function drawRiverBanks(points, riverWidth) {
    const leftBank = [];
    const rightBank = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let angle;

      if (i === 0) {
        angle = Math.atan2(points[1].y - p.y, points[1].x - p.x);
      } else if (i === points.length - 1) {
        const prev = points[i - 1];
        angle = Math.atan2(p.y - prev.y, p.x - prev.x);
      } else {
        const prev = points[i - 1];
        const next = points[i + 1];
        angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      }

      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const halfW = riverWidth / 2;

      leftBank.push({ x: p.x + perpX * halfW, y: p.y + perpY * halfW });
      rightBank.push({ x: p.x - perpX * halfW, y: p.y - perpY * halfW });
    }

    ctx.fillStyle = "rgba(60, 100, 50, 0.35)";
    ctx.beginPath();
    ctx.moveTo(leftBank[0].x, leftBank[0].y);
    for (let i = 1; i < leftBank.length; i++) {
      ctx.lineTo(leftBank[i].x, leftBank[i].y);
    }
    for (let i = rightBank.length - 1; i >= 0; i--) {
      ctx.lineTo(rightBank[i].x, rightBank[i].y);
    }
    ctx.closePath();
    ctx.fill();

    return { leftBank, rightBank };
  }

  function drawRiverWater(leftBank, rightBank, shimmerOffset) {
    const waterGrad = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.8);
    waterGrad.addColorStop(0, "rgba(50, 120, 160, 0.85)");
    waterGrad.addColorStop(0.5, "rgba(40, 100, 140, 0.9)");
    waterGrad.addColorStop(1, "rgba(30, 80, 120, 0.85)");

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(leftBank[0].x, leftBank[0].y);
    for (let i = 1; i < leftBank.length; i++) {
      ctx.lineTo(leftBank[i].x, leftBank[i].y);
    }
    for (let i = rightBank.length - 1; i >= 0; i--) {
      ctx.lineTo(rightBank[i].x, rightBank[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(shimmerOffset) * 0.1;
    ctx.strokeStyle = "rgba(180, 220, 255, 0.6)";
    ctx.lineWidth = 1.5;
    for (let i = 5; i < leftBank.length - 5; i += 8) {
      const midX = (leftBank[i].x + rightBank[i].x) / 2;
      const midY = (leftBank[i].y + rightBank[i].y) / 2;
      const waveLen = (rightBank[i].x - leftBank[i].x) * 0.3;
      ctx.beginPath();
      ctx.moveTo(midX - waveLen, midY + Math.sin(shimmerOffset + i * 0.5) * 2);
      ctx.quadraticCurveTo(
        midX,
        midY + Math.sin(shimmerOffset + i * 0.5 + 1) * 4 - 2,
        midX + waveLen,
        midY + Math.sin(shimmerOffset + i * 0.5 + 2) * 2
      );
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(120, 200, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(leftBank[0].x, leftBank[0].y);
    for (let i = 1; i < leftBank.length; i++) {
      ctx.lineTo(leftBank[i].x, leftBank[i].y);
    }
    for (let i = rightBank.length - 1; i >= 0; i--) {
      ctx.lineTo(rightBank[i].x, rightBank[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawVegetation(points, riverWidth) {
    ctx.fillStyle = "rgba(50, 90, 40, 0.6)";
    for (let i = 10; i < points.length - 10; i += 12) {
      const p = points[i];
      const size = 3 + Math.sin(i * 1.7) * 2;
      const offset = (i % 2 === 0 ? 1 : -1) * (riverWidth / 2 + 6);

      let angle;
      if (i === 0) {
        angle = Math.atan2(points[1].y - p.y, points[1].x - p.x);
      } else {
        const prev = points[i - 1];
        const next = points[Math.min(i + 1, points.length - 1)];
        angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      }

      const vx = p.x + -Math.sin(angle) * offset;
      const vy = p.y + Math.cos(angle) * offset;

      ctx.beginPath();
      ctx.ellipse(vx, vy, size, size * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawForegroundSand() {
    const gradient = ctx.createLinearGradient(0, height * 0.85, 0, height);
    gradient.addColorStop(0, "rgba(100, 70, 35, 0)");
    gradient.addColorStop(1, "rgba(70, 45, 20, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.85, width, height * 0.15);
  }

  function drawHeatHaze() {
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 3; i++) {
      const y = height * (0.5 + i * 0.08) + Math.sin(time * 0.5 + i) * 5;
      ctx.fillStyle = `rgba(255, 200, 120, ${0.3 - i * 0.08})`;
      ctx.fillRect(0, y, width, height * 0.04);
    }
    ctx.restore();
  }

  function render() {
    time += 0.016;
    drawSky();
    drawSun();
    drawDistantMountains();
    drawDesertBase();
    drawDunes();

    const riverWidth = Math.min(width, height) * 0.045;
    const leftRiver = getRiverPath("left");
    const rightRiver = getRiverPath("right");

    const leftBanks = drawRiverBanks(leftRiver, riverWidth);
    const rightBanks = drawRiverBanks(rightRiver, riverWidth);

    drawVegetation(leftRiver, riverWidth);
    drawVegetation(rightRiver, riverWidth);

    drawRiverWater(leftBanks.leftBank, leftBanks.rightBank, time * 2);
    drawRiverWater(rightBanks.leftBank, rightBanks.rightBank, time * 2 + Math.PI);

    drawForegroundSand();
    drawHeatHaze();
  }

  function animate() {
    render();
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
})();
