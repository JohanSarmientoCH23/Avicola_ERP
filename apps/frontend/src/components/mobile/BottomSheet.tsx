"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  showHandle?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  snapPoints = [0.5, 0.9],
  defaultSnap = 0.5,
  showHandle = true,
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "bottom-sheet-title" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          "relative w-full max-h-[90vh] bg-white rounded-t-2xl sm:rounded-xl sm:max-w-lg sm:mx-4 sm:my-8 shadow-2xl",
          "animate-slide-up",
          className
        )}
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(showHandle || title) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            {showHandle && (
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
            )}
            {title && (
              <h2 id="bottom-sheet-title" className="text-lg font-semibold text-gray-800">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>,
    document.body
  );
}

import { useState } from "react";