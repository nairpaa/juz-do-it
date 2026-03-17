"use client";

export function RetentionBadge({ level }: { level: number }) {
  const color = level >= 70 ? "text-green" : level >= 40 ? "text-gold" : level > 0 ? "text-red" : "text-ghost";
  const fill = level >= 70 ? "#6abf7b" : level >= 40 ? "#d4a853" : level > 0 ? "#d47a6a" : "#332e4a";
  const w = 22, h = 11, s = 1.3, r = 3, tip = 2;
  const fw = Math.max(0, ((w - s * 2 - 2) * level) / 100);

  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <svg width={w + tip + 1} height={h} viewBox={`0 0 ${w + tip + 1} ${h}`}>
        <rect x={s/2} y={s/2} width={w-s} height={h-s} rx={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={s} />
        {fw > 0 && <rect x={s+1} y={s+1} width={fw} height={h-s*2-2} rx={1.5} fill={fill} />}
        <rect x={w+.5} y={h*.28} width={tip} height={h*.44} rx={1} fill="rgba(255,255,255,0.05)" />
      </svg>
      <span className="text-xs font-semibold tabular-nums">{level}%</span>
    </span>
  );
}
