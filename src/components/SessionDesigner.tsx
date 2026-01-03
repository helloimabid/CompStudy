"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ArrowDown,
  Save,
  Clock,
  BookOpen,
  Coffee,
  Play,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export type GoalItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type SessionBlock = {
  id: string;
  type: "focus" | "break";
  duration: number; // minutes
  subject?: string;
  goal?: string;
  goals?: GoalItem[]; // checklist goals
};

interface SessionDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blocks: SessionBlock[], startTime: string) => void;
  onStartNow?: (blocks: SessionBlock[]) => void;
  existingSchedule?: Array<{
    $id: string;
    subject: string;
    goal: string;
    duration: number;
    scheduledAt: string;
    type: "focus" | "break";
  }>;
  onDeleteScheduledItem?: (id: string) => void;
  onStartScheduledSession?: (id: string) => void;
}

const getDefaultBlocks = (): SessionBlock[] => [
  {
    id: Math.random().toString(36).substr(2, 9),
    type: "focus",
    duration: 25,
    subject: "",
  },
  { id: Math.random().toString(36).substr(2, 9), type: "break", duration: 5 },
];

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function SessionDesigner({
  isOpen,
  onClose,
  onSave,
  onStartNow,
  existingSchedule,
  onDeleteScheduledItem,
  onStartScheduledSession,
}: SessionDesignerProps) {
  const [blocks, setBlocks] = useState<SessionBlock[]>(getDefaultBlocks());
  const [startTime, setStartTime] = useState(getCurrentTime());
  const [viewMode, setViewMode] = useState<"create" | "view">("create");

  // Reset state when modal opens - show existing schedule if available
  useEffect(() => {
    if (isOpen) {
      if (existingSchedule && existingSchedule.length > 0) {
        setViewMode("view");
      } else {
        setViewMode("create");
        setStartTime(getCurrentTime());
        setBlocks(getDefaultBlocks());
      }
    }
  }, [isOpen, existingSchedule]);

  const addBlock = (type: "focus" | "break") => {
    setBlocks([
      ...blocks,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        duration: type === "focus" ? 25 : 5,
        subject:
          type === "focus"
            ? blocks.find((b) => b.subject)?.subject || ""
            : undefined,
      },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<SessionBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addGoalToBlock = (blockId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: [
                ...(b.goals || []),
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: "",
                  completed: false,
                },
              ],
            }
          : b
      )
    );
  };

  const updateGoal = (blockId: string, goalId: string, text: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: b.goals?.map((g) =>
                g.id === goalId ? { ...g, text } : g
              ),
            }
          : b
      )
    );
  };

  const removeGoal = (blockId: string, goalId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              goals: b.goals?.filter((g) => g.id !== goalId),
            }
          : b
      )
    );
  };

  const totalDuration = blocks.reduce((acc, b) => acc + b.duration, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-medium text-white">
                    Session Designer
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {viewMode === "view"
                      ? "Your scheduled sessions"
                      : "Design your study flow"}
                  </p>
                </div>
                <div className="text-right">
                  {viewMode === "create" ? (
                    <>
                      <div className="text-2xl font-bold text-indigo-400">
                        {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                      </div>
                      <div className="text-xs text-zinc-500">
                        Total Duration
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-zinc-400">
                      {existingSchedule?.length || 0} sessions scheduled
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setViewMode("view")}
                  className={clsx(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    viewMode === "view"
                      ? "text-indigo-400 border-b-2 border-indigo-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  📅 My Schedule ({existingSchedule?.length || 0})
                </button>
                <button
                  onClick={() => {
                    setViewMode("create");
                    setStartTime(getCurrentTime());
                    setBlocks(getDefaultBlocks());
                  }}
                  className={clsx(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    viewMode === "create"
                      ? "text-indigo-400 border-b-2 border-indigo-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  ✨ Create New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {viewMode === "view" ? (
                  /* Existing Schedule View */
                  <div className="space-y-3">
                    {!existingSchedule || existingSchedule.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-zinc-500 mb-4">
                          No sessions scheduled yet
                        </p>
                        <button
                          onClick={() => {
                            setViewMode("create");
                            setStartTime(getCurrentTime());
                            setBlocks(getDefaultBlocks());
                          }}
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                        >
                          Create Your First Schedule
                        </button>
                      </div>
                    ) : (
                      existingSchedule.map((session, index) => (
                        <div key={session.$id} className="relative group">
                          {index > 0 && (
                            <div className="absolute -top-4 left-8 w-0.5 h-4 bg-zinc-800 -z-10"></div>
                          )}
                          <div
                            className={clsx(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all",
                              session.type === "focus"
                                ? "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/30"
                                : "bg-green-500/5 border-green-500/20 hover:border-green-500/30"
                            )}
                          >
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                session.type === "focus"
                                  ? "bg-indigo-500/20 text-indigo-400"
                                  : "bg-green-500/20 text-green-400"
                              )}
                            >
                              {session.type === "focus" ? (
                                <BookOpen size={16} />
                              ) : (
                                <Coffee size={16} />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={clsx(
                                    "text-sm font-medium capitalize",
                                    session.type === "focus"
                                      ? "text-indigo-300"
                                      : "text-green-300"
                                  )}
                                >
                                  {session.type}
                                </span>
                                <span className="text-xs text-zinc-500">•</span>
                                <span className="text-xs text-zinc-400">
                                  {Math.floor(session.duration / 60)} min
                                </span>
                                <span className="text-xs text-zinc-500">•</span>
                                <span className="text-xs text-zinc-400">
                                  {new Date(
                                    session.scheduledAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-white text-sm">
                                {session.subject ||
                                  (session.type === "break"
                                    ? "Break"
                                    : "Focus Session")}
                              </p>
                              {/* Display goals if they exist */}
                              {session.goal &&
                                (() => {
                                  try {
                                    const goals: GoalItem[] = JSON.parse(
                                      session.goal
                                    );
                                    if (goals.length > 0) {
                                      return (
                                        <div className="mt-2 space-y-1">
                                          {goals.map((g) => (
                                            <div
                                              key={g.id}
                                              className="flex items-center gap-1.5 text-xs text-zinc-400"
                                            >
                                              <Square
                                                size={10}
                                                className="text-indigo-400/50"
                                              />
                                              <span>{g.text}</span>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return null;
                                  } catch {
                                    // Not JSON, might be old format
                                    return session.goal ? (
                                      <p className="mt-1 text-xs text-zinc-500">
                                        {session.goal}
                                      </p>
                                    ) : null;
                                  }
                                })()}
                            </div>

                            {onDeleteScheduledItem && (
                              <button
                                onClick={() =>
                                  onDeleteScheduledItem(session.$id)
                                }
                                className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                            {onStartScheduledSession && (
                              <button
                                onClick={() => {
                                  onStartScheduledSession(session.$id);
                                  onClose();
                                }}
                                className={clsx(
                                  "p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium",
                                  session.type === "focus"
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                    : "bg-green-600 hover:bg-green-500 text-white"
                                )}
                                title="Start this session"
                              >
                                <Play size={14} fill="currentColor" />
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Create New Schedule View */
                  <>
                    <div className="flex items-center gap-4 mb-6 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                      <label className="text-sm text-zinc-400">
                        Start Time:
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-3">
                      {blocks.map((block, index) => (
                        <div key={block.id} className="relative group">
                          {index > 0 && (
                            <div className="absolute -top-4 left-8 w-0.5 h-4 bg-zinc-800 -z-10"></div>
                          )}
                          <div
                            className={clsx(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all",
                              block.type === "focus"
                                ? "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/30"
                                : "bg-green-500/5 border-green-500/20 hover:border-green-500/30"
                            )}
                          >
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                block.type === "focus"
                                  ? "bg-indigo-500/20 text-indigo-400"
                                  : "bg-green-500/20 text-green-400"
                              )}
                            >
                              {block.type === "focus" ? (
                                <BookOpen size={16} />
                              ) : (
                                <Coffee size={16} />
                              )}
                            </div>

                            <div className="flex-1 grid grid-cols-12 gap-4">
                              <div className="col-span-3">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1 block">
                                  Type
                                </label>
                                <div
                                  className={clsx(
                                    "text-sm font-medium capitalize",
                                    block.type === "focus"
                                      ? "text-indigo-300"
                                      : "text-green-300"
                                  )}
                                >
                                  {block.type}
                                </div>
                              </div>

                              <div className="col-span-3">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1 block">
                                  Duration
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={block.duration}
                                    onChange={(e) =>
                                      updateBlock(block.id, {
                                        duration: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/20"
                                  />
                                  <span className="text-xs text-zinc-500">
                                    min
                                  </span>
                                </div>
                              </div>

                              {block.type === "focus" && (
                                <div className="col-span-6">
                                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1 block">
                                    Subject
                                  </label>
                                  <input
                                    type="text"
                                    value={block.subject || ""}
                                    onChange={(e) =>
                                      updateBlock(block.id, {
                                        subject: e.target.value,
                                      })
                                    }
                                    placeholder="What are you studying?"
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/20"
                                  />
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => removeBlock(block.id)}
                              className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Goals Checklist for Focus blocks */}
                          {block.type === "focus" && (
                            <div className="ml-12 mt-2 space-y-2">
                              {block.goals && block.goals.length > 0 && (
                                <div className="space-y-1.5">
                                  {block.goals.map((goal) => (
                                    <div
                                      key={goal.id}
                                      className="flex items-center gap-2 group/goal"
                                    >
                                      <Square
                                        size={14}
                                        className="text-indigo-400/50 shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={goal.text}
                                        onChange={(e) =>
                                          updateGoal(
                                            block.id,
                                            goal.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="What do you want to accomplish?"
                                        className="flex-1 bg-transparent border-b border-white/5 px-1 py-0.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/30 placeholder:text-zinc-600"
                                      />
                                      <button
                                        onClick={() =>
                                          removeGoal(block.id, goal.id)
                                        }
                                        className="p-1 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover/goal:opacity-100"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => addGoalToBlock(block.id)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors py-1"
                              >
                                <Plus size={12} />
                                Add goal
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6 justify-center">
                      <button
                        onClick={() => addBlock("focus")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all text-sm font-medium"
                      >
                        <Plus size={16} /> Add Focus
                      </button>
                      <button
                        onClick={() => addBlock("break")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all text-sm font-medium"
                      >
                        <Plus size={16} /> Add Break
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-between gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                {viewMode === "create" && (
                  <div className="flex gap-3">
                    {onStartNow && (
                      <button
                        onClick={() => onStartNow(blocks)}
                        className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all text-sm font-medium flex items-center gap-2"
                      >
                        <Clock size={16} /> Start Now
                      </button>
                    )}
                    <button
                      onClick={() => onSave(blocks, startTime)}
                      className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <Save size={16} /> Save Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
