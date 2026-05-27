import { TrendIcon } from "./icons";

export default function KapitaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-[#f97316] rounded-lg flex items-center justify-center flex-shrink-0">
        <TrendIcon />
      </div>
      <span className="text-[#f97316] font-bold text-lg tracking-[0.2em]">
        KAPITA
      </span>
    </div>
  );
}
