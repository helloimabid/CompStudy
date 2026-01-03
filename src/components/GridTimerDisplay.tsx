"use client";
import React from "react";
import clsx from "clsx";

const DIGIT_PATTERNS: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  "1": [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  "2": [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
  "3": [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  "4": [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  "5": [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  "6": [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  "8": [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  ":": [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
};

const GridDigit = ({
  char,
  size = "md",
  isBreak,
  themeColor,
}: {
  char: string;
  size?: "sm" | "md" | "lg";
  isBreak?: boolean;
  themeColor?: string;
}) => {
  const pattern = DIGIT_PATTERNS[char] || Array(15).fill(0);

  // Size configurations (block size and gap in pixels)
  const sizes = {
    sm: { gap: 2, block: 4 }, // Small widget
    md: { gap: 5, block: 12 }, // Dashboard (Increased size)
    lg: { gap: 8, block: 24 }, // Fullscreen (Increased size)
  };

  const { gap, block } = sizes[size];

  // Determine color based on props
  let activeColor = "#6366f1"; // Default Indigo

  if (themeColor) {
    // Map theme names to hex colors if passed as names, or use as is
    const colorMap: Record<string, string> = {
      indigo: "#6366f1",
      cyan: "#06b6d4",
      green: "#22c55e",
      amber: "#f59e0b",
      rose: "#f43f5e",
      violet: "#8b5cf6",
    };
    activeColor = colorMap[themeColor] || themeColor;
  }

  // Break overrides theme unless specifically handled otherwise
  if (isBreak) activeColor = "#22c55e";

  const inactiveColor = "rgba(255,255,255,0.1)";

  return (
    <div
      className="flex-shrink-0"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: `${gap}px`,
        width: `${block * 3 + gap * 2}px`,
      }}
    >
      {pattern.map((active, i) => (
        <div
          key={i}
          style={{
            height: `${block}px`,
            backgroundColor: active ? activeColor : inactiveColor,
            borderRadius: `${Math.max(1, block / 4)}px`,
            boxShadow: active ? `0 0 ${block}px ${activeColor}80` : "none",
            transition: "all 0.3s ease",
            transform: active ? "scale(1)" : "scale(0.8)",
          }}
        />
      ))}
    </div>
  );
};

export default function GridTimerDisplay({
  time,
  size = "md",
  isBreak = false,
  themeColor = "indigo",
}: {
  time: string;
  size?: "sm" | "md" | "lg";
  isBreak?: boolean;
  themeColor?: string;
}) {
  if (!time) return null;

  return (
    <div
      className="flex items-center gap-4 md:gap-6 justify-center select-none"
      suppressHydrationWarning
    >
      {time.split("").map((char, i) => (
        <GridDigit
          key={i}
          char={char}
          size={size}
          isBreak={isBreak}
          themeColor={themeColor}
        />
      ))}
    </div>
  );
}
