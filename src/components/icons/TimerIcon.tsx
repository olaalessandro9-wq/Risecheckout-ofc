interface TimerIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const TimerIcon = ({ className, size = 24, color }: TimerIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="13" r="8"/>
      <polyline points="12 9 12 13 15 15"/>
      <path d="M9 4h6"/>
      <path d="M12 2v2"/>
    </svg>
  );
};

