// RMS Landing — animated scenes
// Each scene self-contains a small timeline that loops while in view.

const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

// ─── Hook: scene-local timeline driven by rAF (always-on) ────────────────────
// If `externalTime` is provided, the hook bypasses its own rAF and returns
// the external time (after loop/speed normalization). This lets the scenes
// be driven by an outer Stage clock when embedded in a video.
function useSceneTime(duration = 6, opts = {}) {
  const { loop = true, speed = 1, autoplay = true, externalTime = null } = opts;
  const ref = useRef(null);
  const [internalTime, setInternalTime] = useState(0);
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);
  const useExt = externalTime != null;

  useEffect(() => {
    if (useExt || !autoplay) { lastTsRef.current = null; return; }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setInternalTime((t) => {
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
  }, [duration, loop, speed, autoplay, useExt]);

  let time;
  if (useExt) {
    let t = externalTime * speed;
    if (loop) t = ((t % duration) + duration) % duration;
    else t = Math.max(0, Math.min(duration, t));
    time = t;
  } else {
    time = internalTime;
  }
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
function HeroTicker({ speed, extTime }) {
  const { ref, time } = useSceneTime(10, { loop: true, speed, externalTime: extTime });

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
function CalendarScene({ speed, extTime }) {
  const { ref, time } = useSceneTime(9, { loop: true, speed, externalTime: extTime });

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
    // Use offset coords (local, unscaled) — NOT getBoundingClientRect, which
    // would return screen-scaled values that mismatch when the Stage applies
    // a transform: scale() to its canvas.
    setCursorRect({
      x: cell.offsetLeft,
      y: cell.offsetTop,
      w: cell.offsetWidth,
      h: cell.offsetHeight,
    });
  }, [targetDay, showCursor, populated]);

  return (
    <div ref={ref} className="canvas">
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

// ============================================================================
// SCENE 3 — AGENT IA  (Trigger → think → suggest → apply)
// ============================================================================
function AgentScene({ speed, extTime }) {
  const { ref, time } = useSceneTime(8, { loop: true, speed, externalTime: extTime });

  const showTrigger = time > 0.4;
  const showThink = time > 1.4 && time < 3.4;
  const showSuggest = time > 3.0;
  const showReason = time > 4.6;
  const showApplied = time > 6.4;

  // Rate animates from 96000 → 108000 between t=3.0 and t=4.0
  const rate = Math.round(lerp(96000, 108000, easeOutBack(between(time, 3.2, 4.6))) / 500) * 500;
  const pctNow = ((rate - 96000) / 96000 * 100);

  return (
    <div ref={ref} className="canvas agent-canvas">
      <span className="canvas-corner">agente · 15 — 17 may</span>

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
// SCENE 5 — COMPSET  (Bars rise; my hotel slides into ranking)
// ============================================================================
function CompsetScene({ speed, hotels: hotelsProp, extTime }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed, externalTime: extTime });

  const defaultHotels = [
    { id: 'c2', name: 'Park Hyatt Mendoza',  rate: 128500, max: 130000 },
    { id: 'c4', name: 'Sheraton Mendoza',    rate: 117800, max: 130000 },
    { id: 'me', name: 'Hotel Andina',        rate: 102400, max: 130000, isMe: true },
    { id: 'c1', name: 'Casa de Uco',         rate: 101900, max: 130000 },
    { id: 'c3', name: 'Diplomatic Mendoza',  rate: 93600,  max: 130000 },
  ];
  const hotels = useMemo(() => hotelsProp || defaultHotels, [hotelsProp]);

  // each row appears 0.25s apart, bar fills shortly after
  return (
    <div ref={ref} className="canvas compset-canvas">
      <span className="canvas-corner">set competitivo · 15 may</span>
      {hotels.map((h, i) => {
        const inT = time > 0.3 + i * 0.18;
        const widthT = time > 0.55 + i * 0.18 ? clamp01((time - 0.55 - i * 0.18) / 0.7) : 0;
        const w = `${(h.rate / h.max) * 100 * widthT}%`;
        const rank = i + 1;
        return (
          <div key={h.id} className={`comp-row ${h.isMe ? 'me' : ''} ${inT ? 'in' : ''}`}>
            <div className="comp-name">
              <span style={{ color: 'var(--land-fg-4)', marginRight: 6, fontFamily: 'var(--land-mono)' }}>{`#${rank}`}</span>
              {h.name}
            </div>
            <div className="comp-bar-track">
              <div className="comp-bar-fill" style={{ '--w': w, width: w }} />
            </div>
            <div className="comp-rate">
              ARS {(h.rate / 1000).toFixed(1)}k
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SCENE 6 — RULES FLOW  (If/then/result with animated arrows)
// ============================================================================
function RulesScene({ speed, extTime }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed, externalTime: extTime });

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
function ScenariosScene({ speed, extTime }) {
  const { ref, time } = useSceneTime(7, { loop: true, speed, externalTime: extTime });

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
