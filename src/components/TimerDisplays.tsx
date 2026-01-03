"use client";

import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

// --- Digital Display ---
export const DigitalTimerDisplay = ({
  time,
  themeColor = "indigo",
  isBreak = false,
  size = "md",
}: {
  time: string;
  themeColor?: string;
  isBreak?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400",
    cyan: "text-cyan-400",
    green: "text-green-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
    violet: "text-violet-400",
  };

  const textColor = isBreak
    ? "text-green-400"
    : colorMap[themeColor] || "text-white";

  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl md:text-7xl",
    lg: "text-8xl md:text-9xl",
  };

  return (
    <div
      className={clsx(
        "font-mono font-bold tracking-tighter tabular-nums select-none",
        textColor,
        sizeClasses[size]
      )}
    >
      {time}
    </div>
  );
};

// --- Circular Display ---
export const CircularTimerDisplay = ({
  time,
  progress,
  themeColor = "indigo",
  isBreak = false,
  size = "md",
}: {
  time: string;
  progress: number; // 0 to 100
  themeColor?: string;
  isBreak?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const radius = 120;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorMap: Record<string, string> = {
    indigo: "#6366f1",
    cyan: "#06b6d4",
    green: "#22c55e",
    amber: "#f59e0b",
    rose: "#f43f5e",
    violet: "#8b5cf6",
  };

  const strokeColor = isBreak ? "#22c55e" : colorMap[themeColor] || "#6366f1";

  const sizeMap = {
    sm: 150,
    md: 300,
    lg: 500,
  };

  const currentSize = sizeMap[size];
  const scale = currentSize / 300; // Base size is 300

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: currentSize, height: currentSize }}
    >
      <svg
        height={currentSize}
        width={currentSize}
        viewBox="0 0 300 300"
        className="rotate-[-90deg]"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={150}
          cy={150}
        />
        <circle
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s linear",
          }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={150}
          cy={150}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <DigitalTimerDisplay
          time={time}
          themeColor={themeColor}
          isBreak={isBreak}
          size={size === "lg" ? "md" : "sm"}
        />
      </div>
    </div>
  );
};

// --- Minimal Display ---
export const MinimalTimerDisplay = ({
  time,
  themeColor = "indigo",
  isBreak = false,
  size = "md",
}: {
  time: string;
  themeColor?: string;
  isBreak?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500",
    cyan: "text-cyan-500",
    green: "text-green-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    violet: "text-violet-500",
  };

  const textColor = isBreak
    ? "text-green-500"
    : colorMap[themeColor] || "text-white";

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-5xl",
    lg: "text-8xl",
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className={clsx(
          "font-light tracking-widest opacity-80",
          textColor,
          sizeClasses[size]
        )}
      >
        {time}
      </div>
    </div>
  );
};
