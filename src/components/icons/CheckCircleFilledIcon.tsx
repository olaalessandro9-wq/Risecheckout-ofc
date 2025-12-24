interface CheckCircleFilledIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const CheckCircleFilledIcon = ({ className, size = 20, color = "#10B981" }: CheckCircleFilledIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="10" fill={color} />
      <path
        d="M14.5 7L8.5 13L5.5 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

