"use client";

import {
  X,
  Check,
  Volume2,
  VolumeX,
  Palette,
  Clock,
  Layout,
  Type,
  Repeat,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export type ThemeColor =
  | "indigo"
  | "cyan"
  | "green"
  | "amber"
  | "rose"
  | "violet";
export type VisualMode = "grid" | "minimal" | "cyber";
export type TimerStyle = "grid" | "digital" | "circular" | "minimal";
export type TimerFont =
  | "default"
  | "orbitron"
  | "quantico"
  | "audiowide"
  | "electrolize"
  | "zendots";

interface TimerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;
  timerStyle: TimerStyle;
  setTimerStyle: (style: TimerStyle) => void;
  timerFont: TimerFont;
  setTimerFont: (font: TimerFont) => void;
  autoStartFocus: boolean;
  setAutoStartFocus: (enabled: boolean) => void;
  autoStartBreak: boolean;
  setAutoStartBreak: (enabled: boolean) => void;
  targetDuration: number;
  setTargetDuration: (duration: number) => void;
  applyPreset: (focus: number) => void;
}

const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: "indigo", name: "Deep Space", color: "bg-indigo-500" },
  { id: "cyan", name: "Cyberpunk", color: "bg-cyan-500" },
  { id: "green", name: "Matrix", color: "bg-green-500" },
  { id: "amber", name: "Industrial", color: "bg-amber-500" },
  { id: "rose", name: "Neon City", color: "bg-rose-500" },
  { id: "violet", name: "Synthwave", color: "bg-violet-500" },
];

const PRESETS = [
  { name: "Pomodoro", focus: 25, break: 5 },
  { name: "Deep Work", focus: 50, break: 10 },
  { name: "Quick Sprint", focus: 15, break: 3 },
];

const FONTS: { id: TimerFont; name: string; className: string }[] = [
  { id: "default", name: "Default", className: "font-mono" },
  { id: "orbitron", name: "Orbitron", className: "font-orbitron" },
  { id: "quantico", name: "Quantico", className: "font-quantico" },
  { id: "audiowide", name: "Audiowide", className: "font-audiowide" },
  { id: "electrolize", name: "Electrolize", className: "font-electrolize" },
  { id: "zendots", name: "Zen Dots", className: "font-zendots" },
];

export default function TimerSettings({
  isOpen,
  onClose,
  themeColor,
  setThemeColor,
  soundEnabled,
  setSoundEnabled,
  visualMode,
  setVisualMode,
  timerStyle,
  setTimerStyle,
  timerFont,
  setTimerFont,
  autoStartFocus,
  setAutoStartFocus,
  autoStartBreak,
  setAutoStartBreak,
  targetDuration,
  setTargetDuration,
  applyPreset,
}: TimerSettingsProps) {
  // Helper to parse duration into hours, minutes, seconds
  const hours = Math.floor(targetDuration / 3600);
  const minutes = Math.floor((targetDuration % 3600) / 60);
  const seconds = targetDuration % 60;

  const updateDuration = (h: number, m: number, s: number) => {
    const total = Math.max(0, h * 3600 + m * 60 + s);
    setTargetDuration(total > 0 ? total : 60); // Minimum 1 minute
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                  System Configuration
                </h2>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Theme Selection */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Palette size={14} /> Interface Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setThemeColor(theme.id)}
                        className={clsx(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          themeColor === theme.id
                            ? "bg-white/5 border-white/20 ring-1 ring-white/20"
                            : "bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div
                          className={clsx(
                            "w-4 h-4 rounded-full shadow-lg shadow-current",
                            theme.color
                          )}
                        ></div>
                        <span className="text-sm text-zinc-300">
                          {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Visual Mode */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layout size={14} /> Visual Mode
                  </h3>
                  <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                    {(["grid", "minimal", "cyber"] as VisualMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setVisualMode(m)}
                        className={clsx(
                          "flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all",
                          visualMode === m
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Timer Style */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Type size={14} /> Timer Style
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      ["grid", "digital", "circular", "minimal"] as TimerStyle[]
                    ).map((style) => (
                      <button
                        key={style}
                        onClick={() => setTimerStyle(style)}
                        className={clsx(
                          "py-3 px-4 text-sm font-medium rounded-xl capitalize transition-all border",
                          timerStyle === style
                            ? "bg-white/10 text-white border-white/20"
                            : "bg-zinc-900/30 text-zinc-500 border-white/5 hover:bg-zinc-900/50 hover:text-zinc-300"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Timer Font */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Type size={14} /> Timer Font
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {FONTS.map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setTimerFont(font.id)}
                        className={clsx(
                          "py-3 px-4 rounded-xl transition-all border flex flex-col items-center gap-1",
                          timerFont === font.id
                            ? "bg-white/10 text-white border-white/20"
                            : "bg-zinc-900/30 text-zinc-500 border-white/5 hover:bg-zinc-900/50 hover:text-zinc-300"
                        )}
                      >
                        <span
                          className={clsx(
                            "text-lg tabular-nums",
                            font.className
                          )}
                        >
                          12:34
                        </span>
                        <span className="text-xs">{font.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Automation */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap size={14} /> Automation
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-900/30">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            autoStartBreak
                              ? "bg-green-500/20 text-green-400"
                              : "bg-zinc-800 text-zinc-500"
                          )}
                        >
                          <Repeat size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Auto-start Break
                          </p>
                          <p className="text-xs text-zinc-500">
                            Start break when focus ends
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAutoStartBreak(!autoStartBreak)}
                        className={clsx(
                          "w-12 h-6 rounded-full transition-colors relative",
                          autoStartBreak ? "bg-green-600" : "bg-zinc-700"
                        )}
                      >
                        <div
                          className={clsx(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            autoStartBreak ? "left-7" : "left-1"
                          )}
                        ></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-900/30">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            autoStartFocus
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-zinc-800 text-zinc-500"
                          )}
                        >
                          <Repeat size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Auto-start Focus
                          </p>
                          <p className="text-xs text-zinc-500">
                            Start focus when break ends
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAutoStartFocus(!autoStartFocus)}
                        className={clsx(
                          "w-12 h-6 rounded-full transition-colors relative",
                          autoStartFocus ? "bg-indigo-600" : "bg-zinc-700"
                        )}
                      >
                        <div
                          className={clsx(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                            autoStartFocus ? "left-7" : "left-1"
                          )}
                        ></div>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Custom Duration */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={14} /> Custom Timer Duration
                  </h3>
                  <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30">
                    <div className="flex items-center justify-center gap-2">
                      {/* Hours */}
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                          Hours
                        </label>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() =>
                              updateDuration(hours + 1, minutes, seconds)
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            +
                          </button>
                          <input
                            type="number"
                            value={hours}
                            onChange={(e) =>
                              updateDuration(
                                Math.max(0, parseInt(e.target.value) || 0),
                                minutes,
                                seconds
                              )
                            }
                            className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="23"
                          />
                          <button
                            onClick={() =>
                              updateDuration(
                                Math.max(0, hours - 1),
                                minutes,
                                seconds
                              )
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            -
                          </button>
                        </div>
                      </div>

                      <span className="text-2xl font-bold text-zinc-600 mt-6">
                        :
                      </span>

                      {/* Minutes */}
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                          Minutes
                        </label>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() =>
                              updateDuration(
                                hours,
                                Math.min(59, minutes + 1),
                                seconds
                              )
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            +
                          </button>
                          <input
                            type="number"
                            value={minutes}
                            onChange={(e) =>
                              updateDuration(
                                hours,
                                Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value) || 0)
                                ),
                                seconds
                              )
                            }
                            className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="59"
                          />
                          <button
                            onClick={() =>
                              updateDuration(
                                hours,
                                Math.max(0, minutes - 1),
                                seconds
                              )
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            -
                          </button>
                        </div>
                      </div>

                      <span className="text-2xl font-bold text-zinc-600 mt-6">
                        :
                      </span>

                      {/* Seconds */}
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                          Seconds
                        </label>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() =>
                              updateDuration(
                                hours,
                                minutes,
                                Math.min(59, seconds + 1)
                              )
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            +
                          </button>
                          <input
                            type="number"
                            value={seconds}
                            onChange={(e) =>
                              updateDuration(
                                hours,
                                minutes,
                                Math.max(
                                  0,
                                  Math.min(59, parseInt(e.target.value) || 0)
                                )
                              )
                            }
                            className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="59"
                          />
                          <button
                            onClick={() =>
                              updateDuration(
                                hours,
                                minutes,
                                Math.max(0, seconds - 1)
                              )
                            }
                            className="w-12 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg font-bold"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-zinc-500 mt-4">
                      Total: {hours > 0 ? `${hours}h ` : ""}
                      {minutes > 0 ? `${minutes}m ` : ""}
                      {seconds > 0 ? `${seconds}s` : ""}
                      {hours === 0 && minutes === 0 && seconds === 0
                        ? "0s"
                        : ""}
                    </p>
                  </div>
                </section>

                {/* Timer Presets */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={14} /> Quick Presets
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          applyPreset(preset.focus);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/10 transition-all group"
                      >
                        <span className="text-sm text-zinc-300 font-medium group-hover:text-white">
                          {preset.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="bg-white/5 px-2 py-1 rounded">
                            {preset.focus}m Focus
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Sound Settings */}
                <section>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Volume2 size={14} /> Audio Feedback
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-900/30">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          soundEnabled
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {soundEnabled ? (
                          <Volume2 size={20} />
                        ) : (
                          <VolumeX size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Sound Effects
                        </p>
                        <p className="text-xs text-zinc-500">
                          Timer ticks and completion alarms
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        soundEnabled ? "bg-indigo-600" : "bg-zinc-700"
                      )}
                    >
                      <div
                        className={clsx(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          soundEnabled ? "left-7" : "left-1"
                        )}
                      ></div>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
