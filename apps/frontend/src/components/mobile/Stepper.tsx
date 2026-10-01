"use client";

import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
  orientation = "horizontal",
}: StepperProps) {
  return (
    <nav
      className={cn(
        "relative",
        orientation === "horizontal" ? "flex items-center" : "flex flex-col items-start",
        className
      )}
      aria-label="Progreso de pasos"
    >
      {orientation === "horizontal" && (
        <div
          className="absolute top-3 left-0 right-0 h-1 bg-gray-200 z-0"
          style={{ width: "100%" }}
        />
      )}

      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = !step.disabled && onStepClick;

        return (
          <div
            key={step.id}
            className={cn(
              "relative z-10 flex items-center",
              orientation === "horizontal" ? "flex-1" : "w-full mb-4"
            )}
          >
            {index < steps.length - 1 && orientation === "horizontal" && (
              <div
                className={cn(
                  "absolute top-3 left-1/2 right-1/2 h-1 z-0 transition-colors duration-300",
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}

            <button
              type="button"
              onClick={() => isClickable && onStepClick!(index)}
              disabled={step.disabled}
              className={cn(
                "relative z-10 flex flex-col items-center gap-1.5 transition-all duration-300",
                isClickable
                  ? "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Paso ${index + 1}: ${step.label}${isCompleted ? " (completado)" : ""}`}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  "transition-all duration-300 shadow-md",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-green-600 text-white ring-4 ring-green-200"
                    : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                )}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.icon || (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-[80px]",
                  isActive ? "text-green-700" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </button>

            {orientation === "vertical" && index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-5 top-10 bottom-10 w-0.5 transition-colors duration-300",
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface StepContentProps {
  step: number;
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export function StepContent({ step, currentStep, children, className }: StepContentProps) {
  const isActive = step === currentStep;

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isActive
          ? "animate-fade-in opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none absolute -top-full"
      )}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      <div className={cn(className)}>{children}</div>
    </div>
  );
}