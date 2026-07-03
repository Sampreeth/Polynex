/*
 * Polynex Animations — animations.js
 * ---------------------------------------------
 * 1. Odometer Counters    — mechanical digit-roll on stats
 * 2. 3D Gyroscope Cards   — perspective tilt on mouse move
 * 3. Radar Sweep          — rotating radar on clients section
 * 4. Flight Formation     — planes flyover at random intervals
 * ---------------------------------------------
 * Zero external dependencies. Pure vanilla JS.
 */

(function () {
  'use strict';
  /* -------------------------------------------------------
     2. ODOMETER COUNTERS
  ------------------------------------------------------- */
  function initOdometers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    statNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '+';
      const digits = String(target).split('');
      el.innerHTML = '';
      el.style.cssText = 'display:inline-flex;align-items:flex-start;overflow:hidden;line-height:1;';

      digits.forEach(() => {
        const col = document.createElement('span');
        col.style.cssText = 'display:inline-block;overflow:hidden;height:1.15em;position:relative;vertical-align:top;';
        const strip = document.createElement('span');
        strip.className = 'odo-strip';
        strip.style.cssText = 'display:flex;flex-direction:column;transform:translateY(0);will-change:transform;';
        for (let d = 0; d <= 9; d++) {
          const span = document.createElement('span');
          span.textContent = d;
          span.style.cssText = 'display:block;height:1.15em;line-height:1.15;text-align:center;';
          strip.appendChild(span);
        }
        col.appendChild(strip);
        el.appendChild(col);
      });

      const sfx = document.createElement('span');
      sfx.textContent = suffix;
      sfx.style.cssText = 'display:inline-block;vertical-align:top;margin-left:2px;';
      el.appendChild(sfx);
      el.dataset.odometerTarget = target;
      el.dataset.odometerReady = 'true';
    });

    function runOdometer(el) {
      if (el.dataset.odometerPlayed) return;
      el.dataset.odometerPlayed = 'true';
      const target = parseInt(el.dataset.odometerTarget, 10);
      const digits = String(target).split('');
      const cols = el.querySelectorAll('span > .odo-strip');
      const duration = 1800;
      const start = performance.now();

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(ease * target);
        const currentStr = String(current).padStart(digits.length, '0');

        cols.forEach((strip, i) => {
          const stagger = i * 0.05;
          const cp = Math.max(0, Math.min((progress - stagger) / (1 - stagger + 0.001), 1));
          const ce = 1 - Math.pow(1 - cp, 3);
          const cd = parseInt(String(Math.floor(ce * target)).padStart(digits.length, '0')[i] || '0', 10);
          strip.style.transition = progress > 0.05 ? 'transform 0.1s ease-out' : 'none';
          strip.style.transform = `translateY(${-cd * 1.15}em)`;
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          cols.forEach((strip, i) => {
            strip.style.transform = `translateY(${-parseInt(digits[i], 10) * 1.15}em)`;
          });
        }
      }
      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.dataset.odometerReady === 'true') {
          runOdometer(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
  }


  /* -------------------------------------------------------
     3. 3D GYROSCOPE CARD TILT
  ------------------------------------------------------- */
  function initGyroscopeCards() {
    const cards = document.querySelectorAll('.glass-panel');
    if (!cards.length) return;

    const MAX_TILT = 8;
    const RESET_MS = 400;

    cards.forEach(card => {
      // Inject glare
      const glare = document.createElement('div');
      glare.style.cssText = `
        position:absolute;inset:0;border-radius:inherit;
        pointer-events:none;opacity:0;z-index:0;
        transition:opacity 0.3s ease;
        background:radial-gradient(circle at 50% 50%,rgba(255,255,255,0.18) 0%,transparent 70%);
      `;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.appendChild(glare);

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        const rx = -ny * MAX_TILT;
        const ry = nx * MAX_TILT;

        card.style.transition = 'transform 0.08s ease-out, box-shadow 0.08s ease-out';
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
        card.style.boxShadow = `${-ry * 2}px ${rx * 2}px 40px rgba(201,169,110,0.15),0 20px 60px rgba(0,0,0,0.45)`;

        const gx = ((e.clientX - r.left) / r.width) * 100;
        const gy = ((e.clientY - r.top) / r.height) * 100;
        glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%,rgba(255,255,255,0.16) 0%,transparent 65%)`;
        glare.style.opacity = '1';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = `transform ${RESET_MS}ms cubic-bezier(0.23,1,0.32,1),box-shadow ${RESET_MS}ms ease`;
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        card.style.boxShadow = '';
        glare.style.opacity = '0';
      });
    });
  }
  /* -------------------------------------------------------
     4. RADAR SWEEP — Clients Section
  ------------------------------------------------------- */
  function initRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.parentElement;
    const logos = Array.from(document.querySelectorAll('[data-ping]'));
    const GOLD = '#c9a96e';
    const GOLDF = 'rgba(201,169,110,';
    let W, H, cx, cy, maxR, angle = 0;
    const RPM = 0.28;
    const PING_ARC = 0.2;
    const PING_HOLD = 900;
    const pingTimers = new Map();

    function resize() {
      const r = section.getBoundingClientRect();
      W = canvas.width  = Math.round(r.width)  || 800;
      H = canvas.height = Math.round(r.height) || 400;
      cx = W / 2; cy = H / 2;
      maxR = Math.min(W, H) * 0.50;
    }

    function norm(a) { return ((a % (Math.PI*2)) + Math.PI*2) % (Math.PI*2); }

    function logoAngle(logo) {
      const lr = logo.getBoundingClientRect();
      const sr = section.getBoundingClientRect();
      return Math.atan2((lr.top+lr.height/2)-sr.top-cy, (lr.left+lr.width/2)-sr.left-cx);
    }

    let last = null;
    function draw(ts) {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      angle = norm(angle + RPM * Math.PI * 2 * dt);
      ctx.clearRect(0, 0, W, H);

      // Rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR / 4 * i, 0, Math.PI*2);
        ctx.strokeStyle = GOLDF + (0.06 + (4-i)*0.04) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Crosshairs
      [0, Math.PI/2, Math.PI, Math.PI*3/2].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a)*maxR, cy + Math.sin(a)*maxR);
        ctx.strokeStyle = GOLDF + '0.06)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });

      // Sweep trail (stacked arc slices)
      const trailArc = Math.PI * 5/12;
      for (let i = 0; i < 32; i++) {
        const t = i / 32;
        const a0 = angle - trailArc*(1-t);
        const a1 = angle - trailArc*(1-(i+1)/32);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, a0, a1);
        ctx.closePath();
        ctx.fillStyle = GOLDF + (t * 0.20).toFixed(3) + ')';
        ctx.fill();
      }

      // Leading edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle)*maxR, cy + Math.sin(angle)*maxR);
      ctx.strokeStyle = GOLDF + '0.9)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI*2);
      ctx.fillStyle = GOLD;
      ctx.fill();

      // Ping detection
      logos.forEach(logo => {
        const la = norm(logoAngle(logo));
        const diff = Math.min(Math.abs(norm(angle)-la), Math.PI*2 - Math.abs(norm(angle)-la));
        if (diff < PING_ARC) {
          if (pingTimers.has(logo)) clearTimeout(pingTimers.get(logo));
          logo.classList.add('radar-ping');
          // Ripple ring at logo position
          const lr = logo.getBoundingClientRect();
          const sr = section.getBoundingClientRect();
          const lx = (lr.left + lr.width/2) - sr.left;
          const ly = (lr.top  + lr.height/2) - sr.top;
          ctx.beginPath();
          ctx.arc(lx, ly, Math.max(lr.width, lr.height)*0.75, 0, Math.PI*2);
          ctx.strokeStyle = GOLDF + '0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(lx, ly, 4, 0, Math.PI*2);
          ctx.fillStyle = GOLD;
          ctx.fill();
          pingTimers.set(logo, setTimeout(() => logo.classList.remove('radar-ping'), PING_HOLD));
        }
      });

      if (running) requestAnimationFrame(draw);
    }

    let running = false;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !running) { running = true; last = null; requestAnimationFrame(draw); }
        else if (!e.isIntersecting) { running = false; }
      });
    }, { threshold: 0.1 });
    io.observe(section);
    window.addEventListener('resize', resize);
    resize();
  }
  /* -------------------------------------------------------
     5. FLIGHT FORMATION FLYOVER
     Spawns a formation of planes (echelon / V / diamond)
     flying from bottom-left to top-right at random intervals.
     Fixed overlay — visible across all sections.
  ------------------------------------------------------- */
  function initFlightFormation() {
    // Find the hero section on the homepage
    const hero = document.querySelector(".hero");
    if (!hero) return; // Only run on homepage with hero

    const container = document.createElement("div");
    container.id = "flight-container";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden;";
    hero.appendChild(container);

    // Formation templates: [perp-offset, along-offset] from lead plane
    // perp = perpendicular to flight path, along = along path (negative = behind)
    const FORMATIONS = [
      { name:'echelon-left',  planes: [[0,0],[-1,-1],[-2,-2]] },
      { name:'echelon-right', planes: [[0,0],[1,-1],[2,-2]] },
      { name:'v-form',        planes: [[0,0],[-1,-1],[1,-1],[-2,-2],[2,-2]] },
      { name:'diamond',       planes: [[0,0],[-1,-1],[1,-1],[0,-2]] },
      { name:'pair',          planes: [[0,0],[1,-1]] },
      { name:'trio-vic',      planes: [[0,0],[-1.2,-1],[1.2,-1]] },
    ];

    const SPACING = 45;   // px between planes in formation

    // FontAwesome fa-plane icon factory (fa-plane points RIGHT = 0 degrees)
    function makePlaneIcon(sizePx, rotDeg) {
      const el = document.createElement('i');
      el.className = 'fas fa-plane';
      el.style.cssText = [
        'font-size:' + sizePx + 'px',
        'color:rgba(201,169,110,0.90)',
        'display:block',
        'transform:rotate(' + rotDeg + 'deg)',
        'filter:drop-shadow(0 0 10px rgba(201,169,110,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.25))',
        'line-height:1',
        'will-change:transform'
      ].join(';');
      return el;
    }

    function spawnFlight() {
      const fw = window.innerWidth;
      const fh = window.innerHeight;

      // Flight angle: ~-35 to -50 degrees (up-right)
      const angleDeg = -(35 + Math.random() * 15);
      const angleRad = angleDeg * Math.PI / 180;

      // Spawn from left edge or bottom edge randomly
      let ox, oy;
      if (Math.random() > 0.45) {
        ox = -90;
        oy = fh * (0.25 + Math.random() * 0.65);
      } else {
        ox = fw * (0.02 + Math.random() * 0.38);
        oy = fh + 90;
      }

      // Distance to travel to fully exit screen
      const dist = Math.sqrt(fw * fw + fh * fh) * 1.25;
      const dx = Math.cos(angleRad) * dist;
      const dy = Math.sin(angleRad) * dist;

      const duration = 9 + Math.random() * 7;    // 9–16 s
      const size = 30 + Math.random() * 15;       // 70-110 px
      const formation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];

      // Unit vectors: along and perpendicular to flight direction
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      formation.planes.forEach(([perp, along], idx) => {
        // Position offset in screen coords
        const px = -sinA * perp * SPACING + cosA * along * SPACING;
        const py =  cosA * perp * SPACING + sinA * along * SPACING;

        const startX = ox + px;
        const startY = oy + py;

        // Plane wrapper
        const wrap = document.createElement('div');
        wrap.style.cssText = `
          position: absolute;
          left: ${startX}px;
          top: ${startY}px;
          transform: translate(0,0);
          opacity: 0;
          will-change: transform, opacity;
        `;

        // fa-plane points East(0deg). angleDeg is negative=upward, so maps directly.
        const inner = makePlaneIcon(size, angleDeg);

        // Contrail element
        const trail = document.createElement('div');
        const trailLen = size * 5;
        trail.style.cssText = `
          position: absolute;
          left: ${size/2}px;
          top: ${size/2}px;
          width: ${trailLen}px;
          height: 2.5px;
          transform-origin: 0 50%;
          transform: rotate(${angleDeg + 180}deg) translateX(0);
          background: linear-gradient(90deg, rgba(201,169,110,0.65), transparent);
          pointer-events: none;
        `;

        wrap.appendChild(trail);
        wrap.appendChild(inner);
        container.appendChild(wrap);

        // Stagger each plane 0.25s apart (leader first)
        const delay = idx * 0.22;

        // Animate using requestAnimationFrame double-tick trick
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            wrap.style.transition = `transform ${duration}s linear ${delay}s, opacity 0.6s ease ${delay}s`;
            wrap.style.transform = `translate(${dx}px, ${dy}px)`;
            wrap.style.opacity = '1';

            // Fade out 1.5s before end
            setTimeout(() => {
              wrap.style.opacity = '0';
            }, Math.max(0, (duration + delay - 1.5) * 1000));

            // Clean up DOM
            setTimeout(() => {
              if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }, (duration + delay + 1.2) * 1000);
          });
        });
      });

      // Schedule next flyover: 12–28 seconds gap
      setTimeout(spawnFlight, 45000 + Math.random() * 35000);
    }

    // First flight: 2–6 seconds after page load
    setTimeout(spawnFlight, 15000 + Math.random() * 15000);
  }




  /* --- Init --- */
  function init() {
    initOdometers();
    initGyroscopeCards();
    initRadar();
    initFlightFormation();
  }

  // Use window load so layout is fully painted before canvas sizing
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})();