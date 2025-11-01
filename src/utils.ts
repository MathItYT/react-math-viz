export function makeLinearMapper(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
) {
  const span = domainMax - domainMin || 1e-9;
  const k = (rangeMax - rangeMin) / span;
  return {
    f: (x: number) => rangeMin + (x - domainMin) * k,
    inv: (y: number) => domainMin + (y - rangeMin) / k,
  };
}

export function niceStep(span: number, approxCount: number) {
  const raw = span / Math.max(1, approxCount);
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.abs(raw))));
  const base = raw / pow10;
  let nice;
  if (base >= 10) nice = 10;
  else if (base >= 5) nice = 5;
  else if (base >= 2) nice = 2;
  else if (base >= 1) nice = 1;
  else if (base >= 0.5) nice = 0.5;
  else nice = 0.2;
  return nice * pow10;
}

export function generateTicks(
  min: number,
  max: number,
  approxCount: number
): number[] {
  if (!(isFinite(min) && isFinite(max))) return [];
  if (min === max) return [min];
  const step = niceStep(max - min, approxCount);
  const eps = 1e-12;
  // If the range crosses zero, anchor ticks at 0 and step outwards
  if (min <= 0 && 0 <= max) {
    const ticks: number[] = [0];
    // Positive direction
    for (let t = step; t <= max + eps; t += step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    // Negative direction
    for (let t = -step; t >= min - eps; t -= step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    // Sort and dedupe
    const uniq = Array.from(new Set(ticks.map((v) => Number(v.toFixed(12))))).sort((a, b) => a - b);
    return uniq;
  } else {
    // Otherwise fall back to starting at the first tick >= min
    const start = Math.ceil(min / step) * step;
    const ticks: number[] = [];
    for (let t = start; t <= max + eps; t += step) {
      const val = Math.abs(t) < eps ? 0 : t;
      ticks.push(Number(val.toFixed(12)));
    }
    return ticks;
  }
}

export function pathFromPoints(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  const [p0, ...rest] = points;
  return 'M ' + p0.x + ' ' + p0.y + ' ' + rest.map((p) => 'L ' + p.x + ' ' + p.y).join(' ');
}

// Generate ticks using a fixed delta and an anchor (default 0).
// If the range contains the anchor, produce symmetric ticks around it.
// Otherwise, start from the smallest multiple of delta greater than min.
export function generateTicksFromDelta(
  min: number,
  max: number,
  delta: number,
  anchor = 0
): number[] {
  if (!(isFinite(min) && isFinite(max) && isFinite(delta))) return [];
  const d = Math.abs(delta) || 1e-9;
  const eps = 1e-12;

  if (min <= anchor && anchor <= max) {
    const ticks: number[] = [anchor];
    for (let t = anchor + d; t <= max + eps; t += d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    for (let t = anchor - d; t >= min - eps; t -= d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    const uniq = Array.from(new Set(ticks.map((v) => Number(v.toFixed(12))))).sort((a, b) => a - b);
    return uniq;
  } else {
    const kStart = Math.ceil((min - anchor) / d);
    const start = anchor + kStart * d;
    const ticks: number[] = [];
    for (let t = start; t <= max + eps; t += d) ticks.push(Number((Math.abs(t) < eps ? 0 : t).toFixed(12)));
    return ticks;
  }
}
