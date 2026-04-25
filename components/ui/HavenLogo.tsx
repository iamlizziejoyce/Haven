interface HavenLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function HavenLogo({ size = "md", className = "" }: HavenLogoProps) {
  const iconSize = size === "lg" ? "text-[22px]" : size === "sm" ? "text-[16px]" : "text-[20px]";
  const nameSize =
    size === "lg" ? "text-[36px] tracking-[10px]" : size === "sm" ? "text-[22px] tracking-[8px]" : "text-[28px] tracking-[10px]";
  const subSize = size === "lg" ? "text-[12px]" : "text-[11px]";

  return (
    <div className={`text-center ${className}`}>
      <span className={`${iconSize} text-gold block mb-2`}>◈</span>
      <span className={`font-serif ${nameSize} font-semibold text-white block mb-1.5`}>HAVEN</span>
      <span className={`${subSize} text-[#4A6888] italic`}>
        a relationship-aware personal companion
      </span>
    </div>
  );
}
