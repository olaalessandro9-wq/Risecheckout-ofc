import React from 'react';

interface CheckIconCaktoProps {
  size?: number;
  color?: string;
  className?: string;
}

export const CheckIconCakto: React.FC<CheckIconCaktoProps> = ({
  size = 24,
  color = "currentColor",
  className = ""
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={color}
        opacity="0.1"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

