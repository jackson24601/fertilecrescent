(function () {
  const canvas = document.getElementById("game-board");
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let time = 0;

  // Deterministic pseudo-random for stable layout across frames
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(42);

  // Precomputed layout in normalized 0–1 board space
  const riverDefs = [
    {
      // Main river — Euphrates-like, flowing top-left to bottom-right
      points: [
        { x: 0.02, y: 0.18 },
        { x: 0.12, y: 0.28 },
        { x: 0.22, y: 0.35 },
        { x: 0.32, y: 0.42 },
        { x: 0.42, y: 0.52 },
        { x: 0.52, y: 0.58 },
        { x: 0.62, y: 0.68 },
        { x: 0.74, y: 0.78 },
        { x: 0.88, y: 0.88 },
        { x: 1.02, y: 0.94 },
      ],
      width: 0.038,
    },
    {
      // Second river — Tigris-like, upper arc
      points: [
        { x: 0.08, y: -0.02 },
        { x: 0.2, y: 0.12 },
        { x: 0.34, y: 0.2 },
        { x: 0.48, y: 0.28 },
        { x: 0.6, y: 0.38 },
        { x: 0.72, y: 0.48 },
        { x: 0.86, y: 0.55 },
        { x: 1.02, y: 0.6 },
      ],
      width: 0.028,
    },
    {
      // Tributary branching near the settlement
      points: [
        { x: 0.28, y: 0.4 },
        { x: 0.36, y: 0.48 },
        { x: 0.4, y: 0.58 },
        { x: 0.38, y: 0.7 },
        { x: 0.32, y: 0.82 },
        { x: 0.28, y: 0.95 },
      ],
      width: 0.018,
    },
  ];

  const treeClusters = [
    { cx: 0.18, cy: 0.32, count: 9, spread: 0.055 },
    { cx: 0.3, cy: 0.38, count: 7, spread: 0.045 },
    { cx: 0.55, cy: 0.34, count: 8, spread: 0.05 },
    { cx: 0.68, cy: 0.52, count: 6, spread: 0.04 },
    { cx: 0.42, cy: 0.72, count: 7, spread: 0.045 },
  ];

  const hutPositions = [
    { x: 0.48, y: 0.48, scale: 1.1 },
    { x: 0.54, y: 0.46, scale: 1.0 },
    { x: 0.51, y: 0.53, scale: 1.15 },
    { x: 0.45, y: 0.52, scale: 0.95 },
    { x: 0.57, y: 0.52, scale: 1.0 },
    { x: 0.5, y: 0.58, scale: 0.9 },
    { x: 0.43, y: 0.46, scale: 0.85 },
  ];

  // 20 villagers scattered around the hut cluster
  const villagers = [];
  for (let i = 0; i < 20; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 0.06 + rand() * 0.12;
    villagers.push({
      x: 0.5 + Math.cos(angle) * dist * (0.7 + rand() * 0.5),
      y: 0.52 + Math.sin(angle) * dist * 0.85,
      hue: 20 + rand() * 25,
      scale: 0.85 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.6,
    });
  }

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

  function nx(x) {
    return x * width;
  }

  function ny(y) {
    return y * height;
  }

  function drawSand() {
    const base = ctx.createLinearGradient(0, 0, width * 0.3, height);
    base.addColorStop(0, "#d4b06a");
    base.addColorStop(0.35, "#c9a05a");
    base.addColorStop(0.65, "#b89048");
    base.addColorStop(1, "#a87838");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // Soft dune bands
    const duneRand = mulberry32(7);
    for (let i = 0; i < 14; i++) {
      const y0 = (i / 14) * height;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= width; x += 8) {
        const y =
          y0 +
          Math.sin(x * 0.004 + i * 1.3) * height * 0.018 +
          Math.sin(x * 0.01 + i) * height * 0.008;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, y0 + height * 0.08);
      ctx.lineTo(0, y0 + height * 0.08);
      ctx.closePath();
      ctx.fillStyle = `rgba(${160 + (i % 3) * 12}, ${110 + (i % 4) * 8}, ${50 + (i % 2) * 10}, ${0.08 + duneRand() * 0.06})`;
      ctx.fill();
    }

    // Fine grain speckles
    const grain = mulberry32(99);
    ctx.fillStyle = "rgba(90, 60, 25, 0.12)";
    for (let i = 0; i < 400; i++) {
      const gx = grain() * width;
      const gy = grain() * height;
      const s = 0.6 + grain() * 1.4;
      ctx.fillRect(gx, gy, s, s);
    }
    ctx.fillStyle = "rgba(255, 230, 170, 0.08)";
    for (let i = 0; i < 250; i++) {
      const gx = grain() * width;
      const gy = grain() * height;
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  function samplePath(points, t) {
    const segs = points.length - 1;
    const f = t * segs;
    const i = Math.min(Math.floor(f), segs - 1);
    const u = f - i;
    const a = points[i];
    const b = points[i + 1];
    return {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
    };
  }

  function pathTangent(points, t) {
    const delta = 0.01;
    const a = samplePath(points, Math.max(0, t - delta));
    const b = samplePath(points, Math.min(1, t + delta));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function buildRiverBanks(def) {
    const samples = 60;
    const left = [];
    const right = [];
    const half = def.width / 2;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = samplePath(def.points, t);
      const tan = pathTangent(def.points, t);
      const px = -tan.y;
      const py = tan.x;
      // Slight natural width variation
      const wiggle = half * (1 + Math.sin(t * Math.PI * 4 + def.width * 40) * 0.15);
      left.push({ x: p.x + px * wiggle, y: p.y + py * wiggle });
      right.push({ x: p.x - px * wiggle, y: p.y - py * wiggle });
    }
    return { left, right };
  }

  function drawRiverBanksFill(banks) {
    ctx.beginPath();
    ctx.moveTo(nx(banks.left[0].x), ny(banks.left[0].y));
    for (let i = 1; i < banks.left.length; i++) {
      ctx.lineTo(nx(banks.left[i].x), ny(banks.left[i].y));
    }
    for (let i = banks.right.length - 1; i >= 0; i--) {
      ctx.lineTo(nx(banks.right[i].x), ny(banks.right[i].y));
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(90, 120, 55, 0.45)";
    ctx.fill();
  }

  function drawRiverWater(banks, shimmer) {
    const pad = 0.55;
    const left = [];
    const right = [];

    for (let i = 0; i < banks.left.length; i++) {
      const midX = (banks.left[i].x + banks.right[i].x) / 2;
      const midY = (banks.left[i].y + banks.right[i].y) / 2;
      left.push({
        x: midX + (banks.left[i].x - midX) * pad,
        y: midY + (banks.left[i].y - midY) * pad,
      });
      right.push({
        x: midX + (banks.right[i].x - midX) * pad,
        y: midY + (banks.right[i].y - midY) * pad,
      });
    }

    ctx.beginPath();
    ctx.moveTo(nx(left[0].x), ny(left[0].y));
    for (let i = 1; i < left.length; i++) {
      ctx.lineTo(nx(left[i].x), ny(left[i].y));
    }
    for (let i = right.length - 1; i >= 0; i--) {
      ctx.lineTo(nx(right[i].x), ny(right[i].y));
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, width * 0.2, height);
    grad.addColorStop(0, "#3a8aaa");
    grad.addColorStop(0.45, "#2e7494");
    grad.addColorStop(1, "#256078");
    ctx.fillStyle = grad;
    ctx.fill();

    // Shimmer lines
    ctx.save();
    ctx.strokeStyle = `rgba(200, 235, 255, ${0.25 + Math.sin(shimmer) * 0.1})`;
    ctx.lineWidth = 1.2;
    for (let i = 4; i < left.length - 4; i += 5) {
      const midX = (left[i].x + right[i].x) / 2;
      const midY = (left[i].y + right[i].y) / 2;
      const span = Math.hypot(right[i].x - left[i].x, right[i].y - left[i].y) * 0.28;
      const wave = Math.sin(shimmer + i * 0.6) * 0.004;
      ctx.beginPath();
      ctx.moveTo(nx(midX - span), ny(midY + wave));
      ctx.quadraticCurveTo(
        nx(midX),
        ny(midY - 0.006 + wave),
        nx(midX + span),
        ny(midY + wave)
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTree(x, y, scale) {
    const s = scale * Math.min(width, height) * 0.012;

    // Shadow
    ctx.fillStyle = "rgba(60, 40, 15, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.9, s * 0.7, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(x - s * 0.12, y - s * 0.2, s * 0.24, s * 1.1);

    // Canopy layers
    const greens = ["#2d5a28", "#3a6e32", "#4a8040"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = greens[i];
      ctx.beginPath();
      ctx.ellipse(
        x + (i - 1) * s * 0.15,
        y - s * (0.5 + i * 0.25),
        s * (0.85 - i * 0.1),
        s * (0.7 - i * 0.08),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  function drawTreeClusters() {
    const treeRand = mulberry32(55);
    treeClusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const a = treeRand() * Math.PI * 2;
        const d = treeRand() * cluster.spread;
        const tx = nx(cluster.cx + Math.cos(a) * d);
        const ty = ny(cluster.cy + Math.sin(a) * d * 0.75);
        const scale = 0.7 + treeRand() * 0.7;
        drawTree(tx, ty, scale);
      }
    });
  }

  function drawMountains() {
    const baseX = width * 0.62;
    const baseY = height * 0.02;
    const regionW = width * 0.4;
    const regionH = height * 0.28;

    // Far ridge
    ctx.fillStyle = "#6a5040";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY + regionH * 0.85);
    ctx.lineTo(baseX + regionW * 0.15, baseY + regionH * 0.35);
    ctx.lineTo(baseX + regionW * 0.28, baseY + regionH * 0.55);
    ctx.lineTo(baseX + regionW * 0.42, baseY + regionH * 0.18);
    ctx.lineTo(baseX + regionW * 0.55, baseY + regionH * 0.45);
    ctx.lineTo(baseX + regionW * 0.7, baseY + regionH * 0.12);
    ctx.lineTo(baseX + regionW * 0.85, baseY + regionH * 0.4);
    ctx.lineTo(baseX + regionW, baseY + regionH * 0.25);
    ctx.lineTo(width, baseY + regionH);
    ctx.lineTo(baseX, baseY + regionH);
    ctx.closePath();
    ctx.fill();

    // Mid ridge with warmer tone
    ctx.fillStyle = "#8a6848";
    ctx.beginPath();
    ctx.moveTo(baseX + regionW * 0.05, baseY + regionH);
    ctx.lineTo(baseX + regionW * 0.22, baseY + regionH * 0.48);
    ctx.lineTo(baseX + regionW * 0.35, baseY + regionH * 0.62);
    ctx.lineTo(baseX + regionW * 0.5, baseY + regionH * 0.32);
    ctx.lineTo(baseX + regionW * 0.65, baseY + regionH * 0.55);
    ctx.lineTo(baseX + regionW * 0.8, baseY + regionH * 0.28);
    ctx.lineTo(baseX + regionW * 0.95, baseY + regionH * 0.5);
    ctx.lineTo(width, baseY + regionH * 0.7);
    ctx.lineTo(width, baseY + regionH);
    ctx.closePath();
    ctx.fill();

    // Snow / light caps
    ctx.fillStyle = "rgba(244, 228, 200, 0.55)";
    const caps = [
      [0.42, 0.18, 0.08],
      [0.7, 0.12, 0.07],
      [0.5, 0.32, 0.05],
      [0.8, 0.28, 0.05],
    ];
    caps.forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.moveTo(baseX + regionW * (cx - r), baseY + regionH * (cy + r * 0.8));
      ctx.lineTo(baseX + regionW * cx, baseY + regionH * cy);
      ctx.lineTo(baseX + regionW * (cx + r), baseY + regionH * (cy + r * 0.8));
      ctx.closePath();
      ctx.fill();
    });

    // Soft foothill blend into sand
    const fade = ctx.createLinearGradient(0, baseY + regionH * 0.7, 0, baseY + regionH * 1.15);
    fade.addColorStop(0, "rgba(168, 120, 56, 0)");
    fade.addColorStop(1, "rgba(168, 120, 56, 0.55)");
    ctx.fillStyle = fade;
    ctx.fillRect(baseX, baseY + regionH * 0.65, regionW + width * 0.05, regionH * 0.55);
  }

  function drawHut(hx, hy, scale) {
    const s = scale * Math.min(width, height) * 0.018;

    // Ground shadow
    ctx.fillStyle = "rgba(60, 40, 15, 0.3)";
    ctx.beginPath();
    ctx.ellipse(hx, hy + s * 0.55, s * 1.1, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mud-brick body
    const bodyGrad = ctx.createLinearGradient(hx - s, hy - s, hx + s, hy + s);
    bodyGrad.addColorStop(0, "#c4a06a");
    bodyGrad.addColorStop(1, "#9a7040");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(hx - s, hy);
    ctx.lineTo(hx - s * 0.85, hy - s * 0.9);
    ctx.lineTo(hx + s * 0.85, hy - s * 0.9);
    ctx.lineTo(hx + s, hy);
    ctx.closePath();
    ctx.fill();

    // Thatched / reed roof
    ctx.fillStyle = "#6b4a28";
    ctx.beginPath();
    ctx.moveTo(hx - s * 1.15, hy - s * 0.75);
    ctx.lineTo(hx, hy - s * 1.85);
    ctx.lineTo(hx + s * 1.15, hy - s * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#7a5832";
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.9, hy - s * 0.85);
    ctx.lineTo(hx, hy - s * 1.55);
    ctx.lineTo(hx + s * 0.9, hy - s * 0.85);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = "#3a2410";
    ctx.fillRect(hx - s * 0.22, hy - s * 0.55, s * 0.44, s * 0.55);
  }

  function drawHuts() {
    // Sort by y for simple depth
    const sorted = [...hutPositions].sort((a, b) => a.y - b.y);
    sorted.forEach((h) => {
      drawHut(nx(h.x), ny(h.y), h.scale);
    });
  }

  function drawVillager(v) {
    const bob = Math.sin(time * v.speed * 2 + v.phase) * 1.5;
    const wanderX = Math.sin(time * v.speed * 0.35 + v.phase) * width * 0.004;
    const wanderY = Math.cos(time * v.speed * 0.28 + v.phase * 1.3) * height * 0.003;
    const x = nx(v.x) + wanderX;
    const y = ny(v.y) + wanderY + bob;
    const s = v.scale * Math.min(width, height) * 0.0065;

    // Shadow
    ctx.fillStyle = "rgba(50, 35, 15, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y + s * 2.2, s * 0.9, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = `hsl(${v.hue}, 35%, 28%)`;
    ctx.lineWidth = Math.max(1.2, s * 0.35);
    ctx.lineCap = "round";
    const legSwing = Math.sin(time * v.speed * 3 + v.phase) * s * 0.35;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.6);
    ctx.lineTo(x - s * 0.35 - legSwing, y + s * 2);
    ctx.moveTo(x + s * 0.25, y + s * 0.6);
    ctx.lineTo(x + s * 0.35 + legSwing, y + s * 2);
    ctx.stroke();

    // Tunic body
    ctx.fillStyle = `hsl(${v.hue}, 40%, 42%)`;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.7, y + s * 0.9);
    ctx.lineTo(x - s * 0.55, y - s * 0.4);
    ctx.lineTo(x + s * 0.55, y - s * 0.4);
    ctx.lineTo(x + s * 0.7, y + s * 0.9);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#d4a878";
    ctx.beginPath();
    ctx.arc(x, y - s * 0.95, s * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Simple hair / headwrap
    ctx.fillStyle = `hsl(${v.hue + 10}, 30%, 30%)`;
    ctx.beginPath();
    ctx.arc(x, y - s * 1.05, s * 0.55, Math.PI, 0);
    ctx.fill();
  }

  function drawVillagers() {
    const sorted = [...villagers].sort((a, b) => a.y - b.y);
    sorted.forEach(drawVillager);
  }

  function drawAmbient() {
    // Soft warm vignette
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.35,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(40, 25, 10, 0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Gentle heat shimmer bands
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 3; i++) {
      const y = height * (0.25 + i * 0.2) + Math.sin(time * 0.6 + i * 1.4) * 6;
      ctx.fillStyle = "rgba(255, 220, 150, 1)";
      ctx.fillRect(0, y, width, height * 0.03);
    }
    ctx.restore();
  }

  function render() {
    time += 0.016;
    drawSand();

    const banks = riverDefs.map(buildRiverBanks);
    banks.forEach(drawRiverBanksFill);
    banks.forEach((b, i) => drawRiverWater(b, time * 2 + i * 1.2));

    drawMountains();
    drawTreeClusters();
    drawHuts();
    drawVillagers();
    drawAmbient();
  }

  function animate() {
    render();
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
})();
