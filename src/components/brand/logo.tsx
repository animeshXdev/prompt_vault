import React from "react";

export function PromptVaultLogo({ className = "w-6 h-6", showText = false, textClassName = "text-base font-semibold" }: { className?: string; showText?: boolean; textClassName?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Hexagonal Vault Shell */}
          <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            fill="currentColor"
            className="text-indigo-600 dark:text-indigo-500"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Inner Vault Core */}
          <path
            d="M16 7L24 11.5V20.5L16 25L8 20.5V11.5L16 7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-indigo-600 dark:text-indigo-400"
          />
          {/* Command Prompt Terminal Indicator inside Vault */}
          <path
            d="M12 14L15 16L12 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-500 dark:text-indigo-300"
          />
          <line
            x1="17"
            y1="18"
            x2="20"
            y2="18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-indigo-500 dark:text-indigo-300"
          />
        </svg>
      </div>
      {showText && (
        <span className={`tracking-tight font-bold ${textClassName}`}>
          Prompt<span className="text-indigo-600 dark:text-indigo-400">Vault</span>
        </span>
      )}
    </div>
  );
}
