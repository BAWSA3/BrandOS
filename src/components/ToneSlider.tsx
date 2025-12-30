'use client';

interface ToneSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
}

export default function ToneSlider({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: ToneSliderProps) {
  return (
    <div className="group flex-1 min-w-[250px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
        <span className="text-xs tabular-nums text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          {value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between mt-2">
        <span className="text-[11px] text-muted">{leftLabel}</span>
        <span className="text-[11px] text-muted">{rightLabel}</span>
      </div>
    </div>
  );
}
