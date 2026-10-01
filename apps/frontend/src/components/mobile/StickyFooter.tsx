"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StickyFooterProps {
  children: React.ReactNode;
  className?: string;
  showShadow?: boolean;
}

export function StickyFooter({ children, className, showShadow = true }: StickyFooterProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 sm:px-6 sm:pb-6",
        "bg-gradient-to-t from-white via-white/95 to-transparent",
        showShadow && "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
        className
      )}
      role="region"
      aria-label="Acciones principales"
    >
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
}

interface SaveButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  variant?: "primary" | "secondary" | "success";
  disabled?: boolean;
  className?: string;
}

export function SaveButton({
  onClick,
  loading = false,
  label = "Guardar",
  variant = "success",
  disabled = false,
  className,
}: SaveButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    success: "bg-green-600 hover:bg-green-700",
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full sm:w-auto px-6 py-3.5 text-base font-semibold rounded-xl",
        "shadow-lg transition-all duration-200",
        "active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Guardando...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

interface ActionButtonsProps {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}

export function ActionButtons({ primary, secondary, className }: ActionButtonsProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-end", className)}>
      {secondary && (
        <div className="w-full sm:w-auto flex-1">{secondary}</div>
      )}
      <div className="w-full sm:w-auto flex-1">{primary}</div>
    </div>
  );
}