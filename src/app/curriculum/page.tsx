"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID } from "appwrite";
import {
  Plus,
  Trash2,
  BookOpen,
  Target,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FolderOpen,
  FileText,
  ArrowLeft,
  Check,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface Curriculum {
  $id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  targetHours: number;
}

interface Subject {
  $id: string;
  userId: string;
  curriculumId: string;
  name: string;
  description?: string;
  color: string;
  targetHours: number;
  order: number;
}

interface Topic {
  $id: string;
  userId: string;
  subjectId: string;
  curriculumId: string;
  name: string;
  description?: string;
  order: number;
  completed: boolean;
  studyTime: number;
}

type ViewMode = "curriculums" | "subjects" | "topics";

const colorOptions = [
  { value: "#6366f1", name: "Indigo" },
  { value: "#ef4444", name: "Red" },
  { value: "#10b981", name: "Emerald" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#ec4899", name: "Pink" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#84cc16", name: "Lime" },
];

export default function CurriculumPage() {
  const { user } = useAuth();
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("curriculums");
  const [selectedCurriculum, setSelectedCurriculum] =
    useState<Curriculum | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Data state
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [newCurriculum, setNewCurriculum] = useState({
    name: "",
    description: "",
    targetHours: 0,
    color: "#6366f1",
  });
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
    targetHours: 0,
    color: "#6366f1",
  });
  const [newTopic, setNewTopic] = useState({
    name: "",
    description: "",
  });

  // Fetch curriculums
  const fetchCurriculums = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        [Query.equal("userId", user.$id)]
      );
      setCurriculums(response.documents as unknown as Curriculum[]);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch subjects for a curriculum
  const fetchSubjects = useCallback(
    async (curriculumId: string) => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          [
            Query.equal("userId", user.$id),
            Query.equal("curriculumId", curriculumId),
            Query.orderAsc("order"),
          ]
        );
        setSubjects(response.documents as unknown as Subject[]);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Fetch topics for a subject
  const fetchTopics = useCallback(
    async (subjectId: string) => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.TOPICS,
          [
            Query.equal("userId", user.$id),
            Query.equal("subjectId", subjectId),
            Query.orderAsc("order"),
          ]
        );
        setTopics(response.documents as unknown as Topic[]);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchCurriculums();
    }
  }, [user, fetchCurriculums]);

  // Navigation handlers
  const openCurriculum = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setViewMode("subjects");
    fetchSubjects(curriculum.$id);
  };

  const openSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode("topics");
    fetchTopics(subject.$id);
  };

  const goBack = () => {
    if (viewMode === "topics") {
      setSelectedSubject(null);
      setViewMode("subjects");
      if (selectedCurriculum) {
        fetchSubjects(selectedCurriculum.$id);
      }
    } else if (viewMode === "subjects") {
      setSelectedCurriculum(null);
      setViewMode("curriculums");
      fetchCurriculums();
    }
    setIsCreating(false);
  };

  // CRUD handlers
  const handleCreateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        ID.unique(),
        {
          userId: user.$id,
          ...newCurriculum,
          targetHours: Number(newCurriculum.targetHours),
        }
      );
      setIsCreating(false);
      setNewCurriculum({
        name: "",
        description: "",
        targetHours: 0,
        color: "#6366f1",
      });
      fetchCurriculums();
    } catch (error) {
      console.error("Error creating curriculum:", error);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCurriculum) return;
    try {
      await databases.createDocument(DB_ID, COLLECTIONS.SUBJECTS, ID.unique(), {
        userId: user.$id,
        curriculumId: selectedCurriculum.$id,
        ...newSubject,
        targetHours: Number(newSubject.targetHours),
        order: subjects.length,
      });
      setIsCreating(false);
      setNewSubject({
        name: "",
        description: "",
        targetHours: 0,
        color: "#6366f1",
      });
      fetchSubjects(selectedCurriculum.$id);
    } catch (error) {
      console.error("Error creating subject:", error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubject || !selectedCurriculum) return;
    try {
      await databases.createDocument(DB_ID, COLLECTIONS.TOPICS, ID.unique(), {
        userId: user.$id,
        subjectId: selectedSubject.$id,
        curriculumId: selectedCurriculum.$id,
        ...newTopic,
        order: topics.length,
        completed: false,
        studyTime: 0,
      });
      setIsCreating(false);
      setNewTopic({ name: "", description: "" });
      fetchTopics(selectedSubject.$id);
    } catch (error) {
      console.error("Error creating topic:", error);
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm("Delete this curriculum and all its subjects and topics?"))
      return;
    try {
      // Delete all related topics and subjects first
      const subjectsToDelete = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.SUBJECTS,
        [Query.equal("curriculumId", id)]
      );
      for (const subject of subjectsToDelete.documents) {
        const topicsToDelete = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.TOPICS,
          [Query.equal("subjectId", subject.$id)]
        );
        for (const topic of topicsToDelete.documents) {
          await databases.deleteDocument(DB_ID, COLLECTIONS.TOPICS, topic.$id);
        }
        await databases.deleteDocument(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          subject.$id
        );
      }
      await databases.deleteDocument(DB_ID, COLLECTIONS.CURRICULUM, id);
      fetchCurriculums();
    } catch (error) {
      console.error("Error deleting curriculum:", error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete this subject and all its topics?")) return;
    try {
      // Delete all related topics first
      const topicsToDelete = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.TOPICS,
        [Query.equal("subjectId", id)]
      );
      for (const topic of topicsToDelete.documents) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.TOPICS, topic.$id);
      }
      await databases.deleteDocument(DB_ID, COLLECTIONS.SUBJECTS, id);
      if (selectedCurriculum) {
        fetchSubjects(selectedCurriculum.$id);
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.TOPICS, id);
      if (selectedSubject) {
        fetchTopics(selectedSubject.$id);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const toggleTopicCompleted = async (topic: Topic) => {
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.TOPICS, topic.$id, {
        completed: !topic.completed,
      });
      if (selectedSubject) {
        fetchTopics(selectedSubject.$id);
      }
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  // Start study session
  const startStudySession = (topicId?: string) => {
    const params = new URLSearchParams();
    if (selectedCurriculum) params.set("curriculum", selectedCurriculum.$id);
    if (selectedSubject) params.set("subject", selectedSubject.$id);
    if (topicId) params.set("topic", topicId);
    router.push(`/focus?${params.toString()}`);
  };

  if (loading && viewMode === "curriculums" && curriculums.length === 0) {
    return (
      <main className="relative pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  // Get current title and breadcrumb
  const getHeaderInfo = () => {
    if (viewMode === "curriculums") {
      return {
        title: "My Curriculum",
        subtitle: "Create and organize your study plans",
        icon: GraduationCap,
        buttonText: "New Curriculum",
      };
    } else if (viewMode === "subjects") {
      return {
        title: selectedCurriculum?.name || "Subjects",
        subtitle: "Manage subjects in this curriculum",
        icon: FolderOpen,
        buttonText: "Add Subject",
      };
    } else {
      return {
        title: selectedSubject?.name || "Topics",
        subtitle: "Manage chapters and topics",
        icon: FileText,
        buttonText: "Add Topic",
      };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <main className="relative pt-24 md:pt-28 pb-20 min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        {viewMode !== "curriculums" && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <button
              onClick={() => {
                setViewMode("curriculums");
                setSelectedCurriculum(null);
                setSelectedSubject(null);
                fetchCurriculums();
              }}
              className="hover:text-white transition-colors"
            >
              Curriculum
            </button>
            {selectedCurriculum && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => {
                    if (viewMode === "topics") goBack();
                  }}
                  className={clsx(
                    viewMode === "topics"
                      ? "hover:text-white transition-colors"
                      : "text-white"
                  )}
                >
                  {selectedCurriculum.name}
                </button>
              </>
            )}
            {selectedSubject && viewMode === "topics" && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{selectedSubject.name}</span>
              </>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            {viewMode !== "curriculums" && (
              <button
                onClick={goBack}
                className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: selectedSubject?.color
                      ? `${selectedSubject.color}20`
                      : selectedCurriculum?.color
                      ? `${selectedCurriculum.color}20`
                      : "rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <HeaderIcon
                    className="w-5 h-5"
                    style={{
                      color:
                        selectedSubject?.color ||
                        selectedCurriculum?.color ||
                        "#6366f1",
                    }}
                  />
                </div>
                <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight">
                  {headerInfo.title}
                </h1>
              </div>
              <p className="text-zinc-500 text-sm md:text-base ml-14">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {viewMode !== "curriculums" && (
              <button
                onClick={() => startStudySession()}
                className="px-5 py-2.5 rounded-full border border-indigo-500/50 text-indigo-400 text-sm font-medium hover:bg-indigo-500/10 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Study Now
              </button>
            )}
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="group relative px-5 py-2.5 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all flex items-center gap-2 w-fit"
            >
              <Plus className="w-4 h-4" />
              {headerInfo.buttonText}
            </button>
          </div>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">
                      {viewMode === "curriculums" && "New Curriculum"}
                      {viewMode === "subjects" && "New Subject"}
                      {viewMode === "topics" && "New Topic"}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {viewMode === "curriculums" &&
                        "Create a study plan to organize your subjects"}
                      {viewMode === "subjects" &&
                        `Add a subject to ${selectedCurriculum?.name}`}
                      {viewMode === "topics" &&
                        `Add a topic to ${selectedSubject?.name}`}
                    </p>
                  </div>
                </div>

                {/* Curriculum Form */}
                {viewMode === "curriculums" && (
                  <form onSubmit={handleCreateCurriculum} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                          Curriculum Name
                        </label>
                        <input
                          required
                          value={newCurriculum.name}
                          onChange={(e) =>
                            setNewCurriculum({
                              ...newCurriculum,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                          placeholder="e.g. JEE Preparation, Class 10 Board"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                          Weekly Target (Hours)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newCurriculum.targetHours}
                          onChange={(e) =>
                            setNewCurriculum({
                              ...newCurriculum,
                              targetHours: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                          placeholder="20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={newCurriculum.description}
                        onChange={(e) =>
                          setNewCurriculum({
                            ...newCurriculum,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm resize-none"
                        placeholder="Describe your study plan goals"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
                        Color Tag
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() =>
                              setNewCurriculum({
                                ...newCurriculum,
                                color: color.value,
                              })
                            }
                            className={clsx(
                              "w-9 h-9 rounded-full transition-all",
                              newCurriculum.color === color.value
                                ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                                : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-5 py-2.5 rounded-xl text-zinc-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                      >
                        Create Curriculum
                      </button>
                    </div>
                  </form>
                )}

                {/* Subject Form */}
                {viewMode === "subjects" && (
                  <form onSubmit={handleCreateSubject} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                          Subject Name
                        </label>
                        <input
                          required
                          value={newSubject.name}
                          onChange={(e) =>
                            setNewSubject({
                              ...newSubject,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                          placeholder="e.g. Physics, Mathematics, Chemistry"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                          Weekly Target (Hours)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newSubject.targetHours}
                          onChange={(e) =>
                            setNewSubject({
                              ...newSubject,
                              targetHours: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={newSubject.description}
                        onChange={(e) =>
                          setNewSubject({
                            ...newSubject,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm resize-none"
                        placeholder="What topics will you cover in this subject?"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
                        Color Tag
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() =>
                              setNewSubject({
                                ...newSubject,
                                color: color.value,
                              })
                            }
                            className={clsx(
                              "w-9 h-9 rounded-full transition-all",
                              newSubject.color === color.value
                                ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                                : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-5 py-2.5 rounded-xl text-zinc-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                      >
                        Add Subject
                      </button>
                    </div>
                  </form>
                )}

                {/* Topic Form */}
                {viewMode === "topics" && (
                  <form onSubmit={handleCreateTopic} className="space-y-5">
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                        Topic / Chapter Name
                      </label>
                      <input
                        required
                        value={newTopic.name}
                        onChange={(e) =>
                          setNewTopic({ ...newTopic, name: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                        placeholder="e.g. Newton's Laws of Motion, Quadratic Equations"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={newTopic.description}
                        onChange={(e) =>
                          setNewTopic({
                            ...newTopic,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm resize-none"
                        placeholder="Key concepts, subtopics, or notes"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-5 py-2.5 rounded-xl text-zinc-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                      >
                        Add Topic
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Grid */}
        {viewMode === "curriculums" && (
          <>
            {curriculums.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {curriculums.map((curriculum) => (
                  <motion.div
                    key={curriculum.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-all cursor-pointer"
                    onClick={() => openCurriculum(curriculum)}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: curriculum.color }}
                    />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${curriculum.color}20` }}
                          >
                            <GraduationCap
                              className="w-6 h-6"
                              style={{ color: curriculum.color }}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {curriculum.name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Target className="w-3 h-3" />
                              <span>{curriculum.targetHours}h / week</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCurriculum(curriculum.$id);
                          }}
                          className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete curriculum"
                          aria-label="Delete curriculum"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2 min-h-10">
                        {curriculum.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Click to view subjects</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No curriculum yet"
                description="Create your first curriculum to organize your study subjects and topics."
                buttonText="Create Your First Curriculum"
                onButtonClick={() => setIsCreating(true)}
              />
            )}
          </>
        )}

        {viewMode === "subjects" && (
          <>
            {subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                  <motion.div
                    key={subject.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-all cursor-pointer"
                    onClick={() => openSubject(subject)}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${subject.color}20` }}
                          >
                            <BookOpen
                              className="w-6 h-6"
                              style={{ color: subject.color }}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {subject.name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Target className="w-3 h-3" />
                              <span>{subject.targetHours}h / week</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject.$id);
                          }}
                          className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete subject"
                          aria-label="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2 min-h-10">
                        {subject.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Click to view topics</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="No subjects yet"
                description={`Add subjects to "${selectedCurriculum?.name}" to organize your topics.`}
                buttonText="Add Your First Subject"
                onButtonClick={() => setIsCreating(true)}
              />
            )}
          </>
        )}

        {viewMode === "topics" && (
          <>
            {topics.length > 0 ? (
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic.$id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-all"
                  >
                    <button
                      onClick={() => toggleTopicCompleted(topic)}
                      className={clsx(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                        topic.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-zinc-700 hover:border-zinc-500"
                      )}
                    >
                      {topic.completed && <Check className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={clsx(
                          "text-white font-medium",
                          topic.completed && "line-through text-zinc-500"
                        )}
                      >
                        {topic.name}
                      </h4>
                      {topic.description && (
                        <p className="text-xs text-zinc-500 truncate">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    {topic.studyTime > 0 && (
                      <div className="text-xs text-zinc-500 flex-shrink-0">
                        {Math.round(topic.studyTime / 60)} min studied
                      </div>
                    )}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startStudySession(topic.$id)}
                        className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Study this topic"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.$id)}
                        className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete topic"
                        aria-label="Delete topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No topics yet"
                description={`Add chapters or topics to "${selectedSubject?.name}" to track your progress.`}
                buttonText="Add Your First Topic"
                onButtonClick={() => setIsCreating(true)}
              />
            )}

            {/* Progress Summary */}
            {topics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl border border-white/10 bg-[#0a0a0a]"
              >
                <h3 className="text-lg font-medium text-white mb-4">
                  Progress
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${
                          (topics.filter((t) => t.completed).length /
                            topics.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400">
                    {topics.filter((t) => t.completed).length} / {topics.length}{" "}
                    completed
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-zinc-600" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <button
        onClick={onButtonClick}
        className="group relative px-6 py-3 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {buttonText}
      </button>
    </div>
  );
}
