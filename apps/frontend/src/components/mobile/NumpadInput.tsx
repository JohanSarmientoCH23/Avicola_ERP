"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface NumpadInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  suffix?: string;
  showStepper?: boolean;
  compact?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export const NumpadInput = forwardRef<HTMLInputElement, NumpadInputProps>(
  (
    {
      label,
      suffix,
      showStepper = true,
      compact = false,
      min = 0,
      max,
      step = 1,
      className,
      id,
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [text, setText] = useState<string | null>(null);
    const displayValue = text ?? (Number.isFinite(value) ? String(value) : "0");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur();
      props.onKeyDown?.(e);
    };

    const applyDelta = (delta: number) => {
      const current = Number.isFinite(value) ? value : 0;
      const raw = Math.round((current + delta) * 1000) / 1000;
      onChange(Math.min(Math.max(raw, min), max ?? Infinity));
    };

    return (
      <div className="w-full min-w-0">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-gray-500 mb-1 font-medium truncate",
              compact ? "text-[11px]" : "text-xs"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type="number"
            inputMode={props.inputMode ?? "numeric"}
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={(e) => {
              const raw = e.target.value;
              setText(raw);
              onChange(raw === "" ? 0 : Number(raw));
            }}
            onFocus={(e) => {
              onFocus?.(e);
              if (value === 0) setText("");
              else e.currentTarget.select();
            }}
            onBlur={(e) => {
              onBlur?.(e);
              setText(null);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full text-right font-medium bg-white border border-gray-200 rounded-xl tabular-nums",
              "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
              "disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400",
              compact ? "h-10 text-sm rounded-lg" : "h-12 text-lg",
              showStepper && (suffix ? "pr-20" : "pr-12"),
              !showStepper && (suffix ? "pr-12" : "pr-3"),
              className
            )}
          />
          {suffix && (
            <span
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none",
                compact ? "text-[11px]" : "text-sm",
                showStepper ? "right-11" : "right-3"
              )}
            >
              {suffix}
            </span>
          )}
          {showStepper && (
            <div className="absolute right-0 top-0 h-full w-10 flex flex-col">
              <button
                type="button"
                tabIndex={-1}
                aria-label="Incrementar"
                onClick={() => applyDelta(step)}
                className="w-full h-1/2 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border-l border-gray-100 border-b border-gray-100 rounded-tr-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Decrementar"
                onClick={() => applyDelta(-step)}
                className="w-full h-1/2 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100 rounded-br-xl"
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
