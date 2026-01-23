/**
 * LessonRating - 5-star rating component
 * Visual rating with hover states
 */

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonRatingProps {
  initialRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function LessonRating({
  initialRating = 0,
  onRate,
  readonly = false,
  size = "md",
}: LessonRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    if (readonly) return;
    setRating(value);
    onRate?.(value);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(value)}
          onMouseEnter={() => !readonly && setHoverRating(value)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={cn(
            "transition-colors",
            !readonly && "cursor-pointer hover:scale-110 transition-transform"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              value <= displayRating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
