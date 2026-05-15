// RMS Landing — animated scenes
// Each scene self-contains a small timeline that loops while in view.

const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// ─── Hook: scene-local timeline driven by rAF (always-on) ────────────────────
function useSceneTime(duration = 6, opts = {}) {
  const { loop = true, speed = 1, autoplay = true } = opts;
  const ref = useRef(null);
  const [time, setTime] = useState(0);
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!autoplay) { lastTsRef.current = null; return; }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt * speed;
        if (next >= duration) {
          if (loop) next = next % duration;
          else next = duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [duration, loop, speed, autoplay]);

  return { ref, time, active: true };
}

// Linear interpolation utility
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const between = (t, a, b) => clamp01((t - a) / (b - a));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const fmtMoney = (n) => 'ARS ' + Math.round(n).toLocaleString('es-AR');
const fmtMoneyK = (n) => 'ARS ' + (Math.round(n / 1000)).toLocaleString('es-AR') + 'k';

// ============================================================================
// SCENE 1 — HERO  (Ticker strip with live numbers)
// ============================================================================
function HeroTicker({ speed }) {
  const { ref, time } = useSceneTime(10, { loop: true, speed });

  // each metric cycles between two value sets to feel "live"
  const phase = (time % 10) / 10;
  const pulse = Math.sin(time * 1.5) * 0.5 + 0.5;

  // Occupancy: 72 → 82, ADR: 88k → 102k, RevPAR: 62k → 80k, Revenue: 4.2M → 6.8M
  const occ = lerp(72, 82, pulse);
  const adr = lerp(88000, 102000, easeInOut(phase));
  const revpar = adr * (occ / 100);
  const revenue = revpar * 80; // 80 rooms

  const metrics = [
    { label: 'Ocupación hoy', val: occ.toFixed(1), unit: '%', delta: '+6.2%', up: true },
    { label: 'ADR', val: Math.round(adr / 100) * 100, unit: 'ARS', delta: '+12.4%', up: true, fmt: 'k' },
    { label: 'RevPAR', val: Math.round(revpar / 100) * 100, unit: 'ARS', delta: '+19.4%', up: true, fmt: 'k' },
    { label: 'Ingresos', val: revenue, unit: 'ARS', delta: '84% obj.', up: true, fmt: 'M' },
  ];

  return (
    <div ref={ref} className="ticker-strip">
      {metrics.map((m, i) => {
        let display;
        if (m.fmt === 'k') display = (m.val / 1000).toFixed(1) + 'k';
        else if (m.fmt === 'M') display = (m.val / 1000000).toFixed(2) + 'M';
        else display = m.val;
        return (
          <div key={m.label} className="ticker-cell">
            <span className="ticker-label">{m.label}</span>
            <span className="ticker-value tnum">
              {m.unit !== '%' && <span className="unit">{m.unit} </span>}
              {display}
              {m.unit === '%' && <span className="unit">%</span>}
            </span>
            <span className={`ticker-delta ${m.up ? 'up' : 'down'}`}>
              <Sparkline phase={(phase + i * 0.2) % 1} />
              {m.delta}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ phase }) {
  const points = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 60;
    const t = (i / N + phase) % 1;
    const y = 20 - (Math.sin(t * Math.PI * 2) * 6 + Math.sin(t * Math.PI * 4 + 1) * 3 + 10);
    points.push(`${x},${y}`);
  }
  return (
    <svg width="60" height="20" viewBox="0 0 60 24" style={{ overflow: 'visible' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

// ============================================================================
// SCENE 2 — CALENDAR  (Days populate, cursor moves, color-coded demand)
// ============================================================================
function CalendarScene({ speed }) {
  const { ref, time } = useSceneTime(9, { loop: true, speed });

  // 28 days (4 weeks × 7)
  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 28; i++) {
      const date = new Date(2026, 4, 4 + i); // May 4 2026 + i
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      // demand pattern
      const seed = (i * 1.3 + 0.7) % 1;
      let level = 1;
      if (isWeekend) level = seed > 0.5 ? 4 : 3;
      else if (seed > 0.75) level = 3;
      else if (seed > 0.45) level = 2;
      // events
      const isEvent = i === 9 || i === 10;
      const base = 88000 + level * 6500 + (seed - 0.5) * 4000;
      out.push({
        idx: i,
        d: date.getDate(),
        level: isEvent ? 4 : level,
        rate: Math.round(base / 500) * 500,
        event: isEvent,
      });
    }
    return out;
  }, []);

  // populate days sequentially over first 4s
  const populated = Math.min(28, Math.floor(between(time, 0.3, 4.5) * 28));

  // after populate, cursor sweeps through a few key dates
  const cursorTargets = [9, 10, 16, 17, 23]; // event days + weekends
  const cursorTime = Math.max(0, time - 5);
  const cursorIdx = Math.floor((cursorTime / 1.0)) % cursorTargets.length;
  const showCursor = time > 5 && time < 8.5;
  const targetDay = cursorTargets[cursorIdx];

  // measure target day rect
  const containerRef = useRef(null);
  const [cursorRect, setCursorRect] = useState(null);

  useLayoutEffect(() => {
    if (!showCursor || !containerRef.current) { setCursorRect(null); return; }
    const cell = containerRef.current.querySelector(`[data-day="${targetDay}"]`);
    if (!cell) return;
    const c = containerRef.current.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    setCursorRect({ x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height });
  }, [targetDay, showCursor, populated]);

  return (
    <div ref={ref} className="canvas canvas-grid">
      <span className="canvas-corner">may 2026</span>
      <span className="canvas-corner r">80 rooms · ars</span>
      <div ref={containerRef} className="cal">
        {['L','M','M','J','V','S','D'].map((h, i) => (
          <div key={i} className="cal-head">{h}</div>
        ))}
        {days.map((d) => (
          <div
            key={d.idx}
            data-day={d.idx}
            className={`cal-day lvl-${d.level} ${d.event ? 'has-event' : ''} ${d.idx < populated ? 'in' : ''}`}
          >
            <span className="dnum">{d.d}</span>
            <span className="drate">{(d.rate/1000).toFixed(0)}k</span>
            <span className="devent" />
          </div>
        ))}
        {cursorRect && (
          <div
            className={`cal-cursor ${showCursor ? 'show' : ''}`}
            style={{
              left: cursorRect.x - 4,
              top: cursorRect.y - 4,
              width: cursorRect.w + 8,
              height: cursorRect.h + 8,
            }}
          >
            <span className="cal-cursor-label">
              {targetDay === 9 || targetDay === 10 ? 'evento +14%' : 'fin de semana'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Agent scene helpers ──────────────────────────────────────────────────

function RobotIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="14" r="2.2" fill="currentColor"/>
      <circle cx="15" cy="14" r="2.2" fill="currentColor"/>
      <circle cx="9" cy="14" r="0.85" fill="white" opacity="0.9"/>
      <circle cx="15" cy="14" r="0.85" fill="white" opacity="0.9"/>
      <rect x="9.5" y="17.5" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.55"/>
      <line x1="12" y1="8" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
      <rect x="0.5" y="11" width="2.5" height="5" rx="1.25" fill="currentColor" opacity="0.5"/>
      <rect x="21" y="11" width="2.5" height="5" rx="1.25" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function SparkleIcon({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
      <path d="M5 0 L5.75 3.8 L10 5 L5.75 6.2 L5 10 L4.25 6.2 L0 5 L4.25 3.8 Z"/>
    </svg>
  );
}

function AIParticles({ time }) {
  const particles = [
    { x: 8,  y: 14, delay: 0,   size: 9 },
    { x: 87, y: 9,  delay: 1.2, size: 6 },
    { x: 74, y: 81, delay: 2.5, size: 8 },
    { x: 13, y: 79, delay: 0.7, size: 7 },
    { x: 92, y: 50, delay: 1.9, size: 6 },
    { x: 52, y: 93, delay: 3.3, size: 7 },
    { x: 30, y: 6,  delay: 2.8, size: 5 },
    { x: 65, y: 22, delay: 0.4, size: 6 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map((p, i) => {
        const cycle = 3.6;
        const t = ((time + p.delay) % cycle) / cycle;
        const opacity = Math.max(0, Math.sin(t * Math.PI) * 0.52);
        const scale = 0.35 + Math.sin(t * Math.PI) * 0.65;
        const rotate = t * 90;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: 'var(--land-primary)',
            opacity,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          }}>
            <SparkleIcon size={p.size} />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SCENE 3 — AGENT IA  (Trigger → think → suggest → apply)
// ============================================================================
function AgentScene({ speed }) {
  const { ref, time } = useSceneTime(8, { loop: true, speed });

  const showTrigger = time > 0.4;
  const showThink = time > 1.4 && time < 3.4;
  const showSuggest = time > 3.0;
  const showReason = time > 4.6;
  const showApplied = time > 6.4;

  const rate = Math.round(lerp(96000, 108000, easeOutBack(between(time, 3.2, 4.6))) / 500) * 500;
  const pctNow = ((rate - 96000) / 96000 * 100);
  const pulse = (Math.sin(time * 1.8) + 1) / 2;

  return (
    <div ref={ref} className="canvas agent-canvas">
      <AIParticles time={time} />

      <div className="agent-header">
        <div className="agent-robot-icon" style={{ '--pulse': pulse }}>
          <RobotIcon size={18} />
        </div>
        <span className="canvas-corner-label">agente · 15 — 17 may</span>
        <span className="agent-header-badge">IA</span>
      </div>

      <div className={`agent-trigger ${showTrigger ? 'in' : ''}`}>
        <div className="agent-trigger-icon">⚡</div>
        <div className="agent-trigger-text">
          <strong>Demanda detectada</strong> · pickup +25% vs histórico, set comp. subió 8%
        </div>
        <div className="agent-trigger-time">hace 4 min</div>
      </div>

      <div className={`agent-think ${showThink ? 'in' : ''}`}>
        <span>analizando 3 escenarios</span>
        <span className="agent-think-dots"><span /><span /><span /></span>
      </div>

      <div className={`agent-suggest ${showSuggest ? 'in' : ''} ${showReason ? 'show-reason' : ''}`}>
        <div className="agent-suggest-head">
          <span className="agent-suggest-eyebrow">Sugerencia · Estándar</span>
          <span className="agent-conf">Confianza alta</span>
        </div>
        <div className="agent-rate-flip">
          <span className="agent-rate-old">ARS 96.000</span>
          <span className="agent-rate-arrow">→</span>
          <span className="agent-rate-new">ARS {Math.round(rate).toLocaleString('es-AR')}</span>
          <span className="agent-rate-pct">+{pctNow.toFixed(1)}%</span>
        </div>
        <div className="agent-reason">
          Demanda proyectada 25% sobre histórico. Tu tarifa quedaría aún 4% bajo el promedio del set. Margen de revenue estimado: <strong>+ARS 384k</strong>.
        </div>
        <div className={`agent-applied ${showApplied ? 'in' : ''}`}>
          <CheckIcon /> Aplicado a 3 fechas · sincronizado a Booking y Expedia
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================================
// SCENE 4 — RATE LINE  (Curve draws, AI blip pulses at suggested point)
// ============================================================================
function RateLineScene({ speed }) {
  const { ref, time } = useSceneTime(8, { loop: true, speed });

  // 30-day rate curve
  const points = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const dow = (i + 3) % 7;
      const isWeekend = dow === 5 || dow === 6;
      const base = 92000 + (isWeekend ? 14000 : 0) + Math.sin(i * 0.4) * 6000 + ((i * 1.3) % 5) * 800;
      arr.push(base);
    }
    return arr;
  }, []);

  const competitor = points.map((p) => p * 1.08 + 2000);

  const drawT = between(time, 0.3, 2.8);
  const drawCompT = between(time, 1.0, 3.6);
  const showBlip = time > 3.6 && time < 7.2;
  const showProjection = time > 4.4;

  const W = 460, H = 220, padL = 8, padR = 8, padT = 12, padB = 18;
  const xs = (i) => padL + (i / 29) * (W - padL - padR);
  const yMin = 80000, yMax = 130000;
  const ys = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const buildPath = (arr, t, startIdx = 0) => {
    const total = arr.length - startIdx;
    const n = Math.max(2, Math.floor(total * t));
    let d = `M ${xs(startIdx)} ${ys(arr[startIdx])}`;
    for (let i = 1; i < n; i++) {
      const idx = startIdx + i;
      const cx1 = (xs(idx - 1) + xs(idx)) / 2;
      d += ` C ${cx1} ${ys(arr[idx - 1])}, ${cx1} ${ys(arr[idx])}, ${xs(idx)} ${ys(arr[idx])}`;
    }
    return d;
  };

  // Suggestion point at day 14 (Vendimia event)
  const sugDay = 14;
  const sugX = xs(sugDay);
  const sugY = ys(points[sugDay]);

  // Projection ghost line — points lifted +10% from sugDay onwards
  const projection = points.map((p, i) => i >= sugDay ? p * 1.10 : p);
  const projT = between(time, 4.4, 5.8);

  return (
    <div ref={ref} className="canvas rate-canvas">
      <div className="rate-head">
        <div>
          <div className="rate-title">Tarifa Estándar · Próximos 30 días</div>
          <div className="rate-tags">
            <span className="rate-tag"><span className="dot" style={{background: 'var(--land-fg)'}} />Tu tarifa</span>
            <span className="rate-tag"><span className="dot" style={{background: 'var(--land-fg-4)'}} />Set comp.</span>
            <span className="rate-tag"><span className="dot" style={{background: 'var(--land-primary)', borderTop: '2px dashed', backgroundColor: 'transparent'}} />Sugerido</span>
          </div>
        </div>
      </div>
      <div className="rate-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
            <line key={i}
              x1={padL} x2={W - padR}
              y1={padT + g * (H - padT - padB)}
              y2={padT + g * (H - padT - padB)}
              stroke="var(--land-border)" strokeWidth="1" opacity={i === 0 || i === 4 ? 0.6 : 0.3} />
          ))}

          {/* competitor (background, gray) */}
          <path d={buildPath(competitor, drawCompT)}
            stroke="var(--land-fg-4)" strokeWidth="1.5" fill="none"
            strokeDasharray="3 3" opacity="0.6" />

          {/* my rate (foreground, ink) */}
          <path d={buildPath(points, drawT)}
            stroke="var(--land-fg)" strokeWidth="2.2" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* projection (orange dashed, after blip) */}
          {showProjection && (
            <path d={buildPath(projection, projT, sugDay)}
              stroke="var(--land-primary)" strokeWidth="2" fill="none"
              strokeDasharray="4 3" strokeLinecap="round" />
          )}

          {/* area shade under my line — subtle */}
          <path d={`${buildPath(points, drawT)} L ${xs(Math.max(0, Math.floor(29 * drawT)))} ${H - padB} L ${xs(0)} ${H - padB} Z`}
            fill="var(--land-fg)" opacity="0.05" />
        </svg>

        <div
          className={`rate-blip ${showBlip ? 'in' : ''}`}
          style={{ left: `${(sugX / W) * 100}%`, top: `${(sugY / H) * 100}%` }}
        />
      </div>
      <div className="pickup-axis">
        <span>hoy</span><span>+7d</span><span>+14d</span><span>+21d</span><span>+30d</span>
      </div>
    </div>
  );
}

// ============================================================================
// SCENE 5 — COMPSET  (Rate heat-map · ranking badge · actionable suggestion)
// ============================================================================
function CompsetScene({ speed }) {
  const { ref, time } = useSceneTime(10, { loop: true, speed });

  const hotels = [
    { id: 'me', short: 'Andina ★', isMe: true },
    { id: 'c1', short: 'Casa Uco'  },
    { id: 'c2', short: 'Hyatt'     },
    { id: 'c3', short: 'Diplom.'   },
    { id: 'c4', short: 'Sheraton'  },
  ];

  // Deterministic rate grid — same seed as Hub de RMS data.jsx
  const rows = useMemo(() => {
    let s = 73;
    const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const labels = ['8 may','9 may','10 may','11 may','12 may','13 may','14 may'];
    return labels.map((label, i) => {
      const isWknd = i === 3 || i === 4;
      const boost = isWknd ? 1.18 : 1.0;
      const base = 96000 * boost;
      const rates = {
        me: Math.round(base + (rng() - 0.5) * 8000),
        c1: Math.round(base * 1.06 + (rng() - 0.5) * 8000),
        c2: Math.round(base * 1.34 + (rng() - 0.5) * 10000),
        c3: Math.round(base * 0.94 + (rng() - 0.5) * 7000),
        c4: Math.round(base * 1.22 + (rng() - 0.5) * 9000),
      };
      const vals = Object.values(rates);
      return { label, isWknd, rates, min: Math.min(...vals), max: Math.max(...vals) };
    });
  }, []);

  // Phase 1 — grid populates row by row (0.3 → 3.2s)
  const rowsIn = Math.min(7, Math.ceil(between(time, 0.3, 3.2) * 7));

  // Phase 2 — ranking badge slides in and animates #3 → #2 (3.4 → 5.4s)
  const rankOpacity = clamp01((time - 3.4) / 0.45);
  const rankPos = Math.round(lerp(3, 2, easeOut(between(time, 3.9, 5.3))));

  // Phase 3 — actionable suggestion card slides up (5.8 → 10s)
  const suggT = clamp01((time - 5.8) / 0.55);
  const showSugg = time > 5.8;

  return (
    <div ref={ref} className="canvas cmap-canvas">
      <span className="canvas-corner">set competitivo · 8 – 14 may</span>
      <span className="canvas-corner r">5 hoteles · ars</span>

      {/* Heat-map grid */}
      <div className="cmap-wrap">
        <div className="cmap-head-row">
          <div className="cmap-date" />
          {hotels.map(h => (
            <div key={h.id} className={`cmap-col-head ${h.isMe ? 'mine' : ''}`}>{h.short}</div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className={`cmap-row ${ri < rowsIn ? 'in' : ''}`}
               style={{ transitionDelay: `${ri * 30}ms` }}>
            <div className="cmap-date">
              {row.label}
              {row.isWknd && <span className="cmap-wknd">fds</span>}
            </div>
            {hotels.map(h => {
              const v = row.rates[h.id];
              const cheap  = v === row.min;
              const pricey = v === row.max;
              return (
                <div key={h.id}
                     className={`cmap-cell ${h.isMe ? 'mine' : ''} ${cheap ? 'cheap' : ''} ${pricey ? 'pricey' : ''}`}>
                  {ri < rowsIn ? Math.round(v / 1000) + 'k' : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom row: ranking badge + legend */}
      <div className="cmap-bottom">
        <div className="cmap-rank" style={{ opacity: rankOpacity, transform: `translateY(${lerp(6, 0, rankOpacity)}px)` }}>
          <span className="cmap-rank-label">Posición</span>
          <span className="cmap-rank-num" style={{ color: rankPos <= 2 ? 'var(--land-green)' : 'var(--land-primary)' }}>
            #{rankPos}
          </span>
          <span className="cmap-rank-sub">de 5</span>
          {rankPos <= 2 && (
            <span className="cmap-rank-up">↑ mejorando</span>
          )}
        </div>
        <div className="cmap-legend">
          <span><span className="cmap-sw teal" />+ barato</span>
          <span><span className="cmap-sw pink" />+ caro</span>
          <span><span className="cmap-sw me" />tu hotel</span>
        </div>
      </div>

      {/* Actionable suggestion overlay */}
      {showSugg && (
        <div className="cmap-sugg" style={{
          opacity: suggT,
          transform: `translateY(${lerp(12, 0, easeOut(suggT))}px)`,
        }}>
          <span className="cmap-sugg-badge">Sugerencia IA</span>
          <span className="cmap-sugg-text">
            11 – 12 may &nbsp;·&nbsp;
            <span style={{ textDecoration: 'line-through', opacity: 0.45 }}>96k</span>
            {' → '}<strong>108k</strong>
          </span>
          <span className="cmap-sugg-result">Mantené posición #2</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCENE 6 — RULES FLOW  (If/then/result with animated arrows)
// ============================================================================
function RulesScene({ speed }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed });

  const t1 = time > 0.4;
  const a1 = time > 1.4;
  const t2 = time > 2.0;
  const a2 = time > 3.0;
  const t3 = time > 3.6;
  const activeIdx = Math.floor((time % 7) / 2.3); // sweeps focus

  // running counter for "fechas afectadas"
  const counter = Math.round(lerp(0, 12, easeOut(between(time, 3.8, 5.4))));
  const revenue = Math.round(lerp(0, 184, easeOut(between(time, 4.4, 6.0))));

  return (
    <div ref={ref} className="canvas rules-canvas canvas-grid">
      <span className="canvas-corner">regla #1 — subida automática por demanda</span>
      <div className="rules-flow">
        <div className={`rules-node cond ${t1 ? 'in' : ''} ${activeIdx === 0 ? 'active' : ''}`}>
          <span className="rules-node-eyebrow">si</span>
          <span className="rules-node-body">
            ocupación 7d &gt; <span className="num">70%</span>
          </span>
        </div>
        <div className={`rules-arrow ${a1 ? 'in' : ''}`}>
          <div className="rules-arrow-fill" />
        </div>
        <div className={`rules-node action ${t2 ? 'in' : ''} ${activeIdx === 1 ? 'active' : ''}`}>
          <span className="rules-node-eyebrow">entonces</span>
          <span className="rules-node-body">
            subir tarifa <span className="num">+8%</span>
          </span>
        </div>
        <div className={`rules-arrow ${a2 ? 'in' : ''}`}>
          <div className="rules-arrow-fill" />
        </div>
        <div className={`rules-node result ${t3 ? 'in' : ''} ${activeIdx === 2 ? 'active' : ''}`}>
          <span className="rules-node-eyebrow">resultado</span>
          <span className="rules-node-body">
            <span className="num">{counter}</span> fechas · <span className="num">+ARS {revenue}k</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCENE 7 — SCENARIOS  (Base vs projected, delta counts up)
// ============================================================================
function ScenariosScene({ speed }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed });

  const baseIn = time > 0.4;
  const projIn = time > 1.8;
  const showDelta = time > 3.4;

  // counters animate from 0 to target between t=2 and t=4
  const ct = between(time, 2.0, 4.2);

  const rev = Math.round(lerp(7910, 8322, ct));
  const occ = lerp(71.4, 69.6, ct);
  const adr = Math.round(lerp(94.8, 102.3, ct));
  const delta = Math.round(lerp(0, 412, ct));

  return (
    <div ref={ref} className="canvas scen-canvas" style={{ position: 'relative' }}>
      <span className="canvas-corner">escenario · subir 10% fines de semana junio</span>

      <div className={`scen-col`} style={{ opacity: baseIn ? 1 : 0, transform: baseIn ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.22,1,0.36,1)' }}>
        <span className="scen-col-label">Base actual</span>
        <div className="scen-metric">
          <span className="scen-metric-name">Revenue mensual</span>
          <span className="scen-metric-value">ARS 7.910k</span>
        </div>
        <div className="scen-metric">
          <span className="scen-metric-name">Ocupación</span>
          <span className="scen-metric-value">71.4%</span>
        </div>
        <div className="scen-metric">
          <span className="scen-metric-name">ADR</span>
          <span className="scen-metric-value">ARS 94.8k</span>
        </div>
      </div>

      <div className="scen-arrow">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={`scen-col proj`} style={{ opacity: projIn ? 1 : 0, transform: projIn ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 400ms ease 200ms, transform 400ms cubic-bezier(0.22,1,0.36,1) 200ms' }}>
        <span className="scen-col-label">Si aplico el escenario</span>
        <div className="scen-metric">
          <span className="scen-metric-name">Revenue mensual</span>
          <span className="scen-metric-value">ARS {rev.toLocaleString('es-AR')}k</span>
        </div>
        <div className="scen-metric">
          <span className="scen-metric-name">Ocupación</span>
          <span className="scen-metric-value">{occ.toFixed(1)}%</span>
        </div>
        <div className="scen-metric">
          <span className="scen-metric-name">ADR</span>
          <span className="scen-metric-value">ARS {adr.toLocaleString('es-AR')}k</span>
        </div>
      </div>

      <div className={`scen-delta ${showDelta ? 'in' : ''}`}>
        <CheckIcon />
        +ARS {delta}k · +5.2%
      </div>
    </div>
  );
}

// ============================================================================
// SCENE 8 — RESERVATIONS PICKUP  (Counter rolls up; bars stack)
// ============================================================================
function PickupScene({ speed }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed });

  // Counter from 0 → 31 between t=0.4 and t=3.2
  const counter = Math.round(lerp(0, 31, easeOut(between(time, 0.4, 3.4))));
  const revT = lerp(0, 2.876, easeOut(between(time, 0.8, 3.8)));

  const ranges = [
    { range: '8 – 10 may',  count: 11, w: '100%' },
    { range: '15 – 17 may', count: 9,  w: '82%' },
    { range: '22 – 24 may', count: 7,  w: '64%' },
    { range: '29 – 31 may', count: 4,  w: '36%' },
  ];

  return (
    <div ref={ref} className="canvas res-canvas">
      <span className="canvas-corner">pickup · últimas 72 h</span>
      <div className="res-counter">
        <span className="res-num">{counter}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="res-label">reservas nuevas</span>
          <span style={{ fontSize: 13, color: 'var(--land-fg-3)' }}>
            ARS {revT.toFixed(2)}M en revenue · 84 noches
          </span>
        </div>
      </div>
      <div className="res-stack">
        {ranges.map((r, i) => (
          <div
            key={r.range}
            className={`res-row ${time > 1.6 + i * 0.25 ? 'in' : ''}`}
            style={{ '--w': r.w }}
          >
            <span className="res-range">{r.range}</span>
            <div className="res-bar"><div className="res-bar-fill" /></div>
            <span className="res-rev">{r.count} reservas</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SCENE 9 — FINAL STATS GRID  (Big numbers reveal)
// ============================================================================
function FinalStats({ speed }) {
  const { ref, time } = useSceneTime(6, { loop: true, speed, autoplay: true });

  const stats = [
    { label: 'Evaluaciones del modelo', target: 1227, suffix: '', sub: 'desde que activaste el modelo · precisión 94%' },
    { label: 'Tarifas actualizadas / mes', target: 1658, suffix: '', sub: 'sin intervención humana · 6h ahorradas por semana' },
    { label: 'RevPAR vs año anterior', target: 19.4, suffix: '%', sub: 'sobre hoteles del set competitivo (Mendoza · boutique 4★)', prefix: '+' },
  ];

  return (
    <div ref={ref}>
      <div className="stats-grid">
        {stats.map((s, i) => {
          const localT = clamp01((time - (0.2 + i * 0.3)) / 1.2);
          const val = s.target * easeOut(localT);
          const display = s.suffix === '%' ? val.toFixed(1) : Math.round(val).toLocaleString('es-AR');
          return (
            <div key={i} className={`stats-cell ${time > 0.2 + i * 0.3 ? 'in' : ''}`}>
              <span className="label">{s.label}</span>
              <span className="value">
                {s.prefix || ''}{display}{s.suffix}
              </span>
              <span className="sub">{s.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expose ──────────────────────────────────────────────────────────────────
Object.assign(window, {
  HeroTicker, CalendarScene, AgentScene, RateLineScene,
  CompsetScene, RulesScene, ScenariosScene, PickupScene, FinalStats,
});
