import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false, testId }) {
  return (
    <div className="flex items-center gap-1" data-testid={testId}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          data-testid={testId ? `${testId}-star-${n}` : undefined}
          onClick={() => !readOnly && onChange && onChange(n)}
          className={readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
          aria-label={`${n} star`}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}
