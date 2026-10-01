"use client";

import { forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

interface NumpadInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  showStepper?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const NumpadInput = forwardRef<HTMLInputElement, NumpadInputProps>(
  ({ label, suffix, showStepper = true, min = 0, max, step = 1, className, id, ...props }, ref) => {
    const inputId = id || `numpad-${Math.random().toString(36).substr(2, 9)}`;

    useImperativeHandle(ref, () => ({
      focus: () => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        input?.focus();
      },
      select: () => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        input?.select();
      },
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs text-gray-500 mb-1 font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            className={cn(
              "w-full h-12 text-right text-lg font-medium bg-white border border-gray-200 rounded-xl",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
              "disabled:bg-gray-50 disabled:text-gray-400",
              "placeholder:text-gray-400",
              "pr-12",
              suffix && "pr-20",
              className
            )}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              {suffix}
            </span>
          )}
          {showStepper && (
            <div className="absolute right-0 top-0 h-full w-10 flex flex-col justify-center items-center pointer-events-none">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const input = document.getElementById(inputId) as HTMLInputElement;
                  if (input) {
                    const current = parseFloat(input.value) || min;
                    const next = Math.min(current + step, max ?? Infinity);
                    input.value = next.toString();
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                }}
                className="w-full h-1/2 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border-l border-gray-100 border-b border-gray-100 rounded-tr-xl"
                aria-label="Incrementar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const input = document.getElementById(inputId) as HTMLInputElement;
                  if (input) {
                    const current = parseFloat(input.value) || min;
                    const next = Math.max(current - step, min);
                    input.value = next.toString();
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                }}
                className="w-full h-1/2 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100 rounded-br-xl"
                aria-label="Decrementar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NumpadInput.displayName = "NumpadInput";