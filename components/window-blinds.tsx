"use client"

interface WindowBlindsProps {
  opacity?: number;
  lineThickness?: number;
  spacing?: number;
  blur?: number;
  className?: string;
}

export default function WindowBlinds({
  opacity = 0.15,
  lineThickness = 2,
  spacing = 4,
  blur = 0.7,
  className = ""
}: WindowBlindsProps) {
  const style = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, ${opacity}),
      rgba(0, 0, 0, ${opacity}) ${lineThickness}px,
      rgba(0, 0, 0, ${opacity / 5}) ${lineThickness}px,
      rgba(0, 0, 0, ${opacity / 5}) ${lineThickness + spacing}px
    )`,
    pointerEvents: 'none' as const,
    zIndex: 1,
    backdropFilter: `blur(${blur}px)`,
  };

  return (
    <div style={style} className={className} />
  );
} 