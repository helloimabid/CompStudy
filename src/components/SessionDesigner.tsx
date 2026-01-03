"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowDown,
  Save,
  Clock,
  BookOpen,
  Coffee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export type SessionBlock = {
  id: string;
  type: "focus" | "break";
  duration: number; // minutes
  subject?: string;
  goal?: string;
};

interface SessionDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blocks: SessionBlock[], startTime: string) => void;
}

export default function SessionDesigner({
  isOpen,
  onClose,
  onSave,
}: SessionDesignerProps) {
  const [blocks, setBlocks] = useState<SessionBlock[]>([
    { id: "1", type: "focus", duration: 25, subject: "" },
    { id: "2", type: "break", duration: 5 },
  ]);
  const [startTime, setStartTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );

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
                    Design your study flow
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-400">
                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </div>
                  <div className="text-xs text-zinc-500">Total Duration</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div className="flex items-center gap-4 mb-6 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <label className="text-sm text-zinc-400">Start Time:</label>
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
                              <span className="text-xs text-zinc-500">min</span>
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
              </div>

              <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(blocks, startTime)}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium flex items-center gap-2"
                >
                  <Save size={16} /> Save Schedule
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
