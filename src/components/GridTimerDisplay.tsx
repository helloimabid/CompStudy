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
}: {
  char: string;
  size?: "sm" | "md" | "lg";
  isBreak?: boolean;
}) => {
  const pattern = DIGIT_PATTERNS[char] || Array(15).fill(0);

  // Size configurations (block size and gap in pixels)
  const sizes = {
    sm: { gap: 2, block: 4 }, // Small widget
    md: { gap: 5, block: 12 }, // Dashboard (Increased size)
    lg: { gap: 8, block: 24 }, // Fullscreen (Increased size)
  };

  const { gap, block } = sizes[size];
  const color = isBreak ? "#22c55e" : "#6366f1"; // Green for break, Indigo for focus
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
            backgroundColor: active ? color : inactiveColor,
            borderRadius: `${Math.max(1, block / 4)}px`,
            boxShadow: active ? `0 0 ${block}px ${color}80` : "none",
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
}: {
  time: string;
  size?: "sm" | "md" | "lg";
  isBreak?: boolean;
}) {
  if (!time) return null;

  return (
    <div
      className="flex items-center gap-4 md:gap-6 justify-center select-none"
      suppressHydrationWarning
    >
      {time.split("").map((char, i) => (
        <GridDigit key={i} char={char} size={size} isBreak={isBreak} />
      ))}
    </div>
  );
}
