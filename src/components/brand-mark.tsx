import brandMark from "@/assets/pratikriya-mark.png.asset.json";

type Props = {
  size?: number;
  className?: string;
};

/** Official Pratikriya brand mark (leaf + circle emblem). */
export function BrandMark({ size = 38, className }: Props) {
  return (
    <img
      src={brandMark.url}
      alt="Pratikriya AI logo"
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className={`object-contain ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}

export default BrandMark;
