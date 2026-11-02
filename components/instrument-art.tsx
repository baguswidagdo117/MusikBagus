import { Icon, type IconName } from "./icons";
import { cn } from "@/lib/utils";

const MAP: Record<string, IconName> = {
  Gitar: "guitar",
  Bass: "bass",
  Keyboard: "keyboard",
  Drum: "drum",
  Amplifier: "amp",
  Mikrofon: "mic",
  Saxophone: "sparkles",
  Biola: "guitar",
  Ukulele: "guitar",
  Lainnya: "tune",
};

export function instrumentIcon(name: string): IconName {
  return MAP[name] ?? "tune";
}

export function InstrumentArt({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 text-brass-300 shadow-inner",
        className,
      )}
    >
      <Icon name={instrumentIcon(name)} className="h-1/2 w-1/2" strokeWidth={1.4} />
    </span>
  );
}
