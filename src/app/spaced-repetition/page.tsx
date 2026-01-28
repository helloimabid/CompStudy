"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID, Permission, Role } from "appwrite";
import {
  SpacedRepetitionItem,
  ReviewQuality,
  calculateNextReview,
  calculateCustomPatternReview,
  calculateManualReview,
  getDueItems,
  getUpcomingItems,
  calculateStatistics,
  formatInterval,
  getIntervalsFromPattern,
  PRESET_PATTERNS,
  UserSRSettings,
  DEFAULT_SR_SETTINGS,
  SRStatistics,
  ReviewMode,
} from "@/lib/spaced-repetition";
import {
  Brain,
  Plus,
  Check,
  X,
  Clock,
  TrendingUp,
  Calendar,
  BookOpen,
  ArrowRight,
  Settings,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Target,
  AlertCircle,
  Repeat,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import SpacedRepetitionSettings from "@/components/SpacedRepetitionSettings";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

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

interface Subject {
  $id: string;
  userId: string;
  curriculumId: string;
  name: string;
  color: string;
}

interface Curriculum {
  $id: string;
  userId: string;
  name: string;
  color: string;
}

type ViewMode = "dashboard" | "review" | "add" | "settings";

function SpacedRepetitionContent() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [loading, setLoading] = useState(true);
  const [srItems, setSrItems] = useState<SpacedRepetitionItem[]>([]);
  const [statistics, setStatistics] = useState<SRStatistics | null>(null);
  const [dueItems, setDueItems] = useState<SpacedRepetitionItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<SpacedRepetitionItem[]>(
    [],
  );

  // User settings
  const [userSettings, setUserSettings] = useState<UserSRSettings | null>(null);

  // Review state
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);

  // Add topics state
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [addingTopics, setAddingTopics] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState("standard");

  // Fetch user settings
  const fetchUserSettings = useCallback(async () => {
    if (!user) return;

    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.USER_SR_SETTINGS,
        [Query.equal("userId", user.$id), Query.limit(1)],
      );

      if (response.documents.length > 0) {
        const settings = response.documents[0] as unknown as UserSRSettings;
        setUserSettings(settings);
        setSelectedPatternId(settings.selectedPatternId || "standard");
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  }, [user]);

  // Fetch all spaced repetition items for the user
  const fetchSRItems = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Ensure collection ID exists
      const collectionId = COLLECTIONS.SPACED_REPETITION;
      if (!collectionId) {
        console.error("SPACED_REPETITION collection ID is not defined");
        return;
      }

      const response = await databases.listDocuments(DB_ID, collectionId, [
        Query.equal("userId", user.$id),
        Query.limit(500),
      ]);

      const items = response.documents as unknown as SpacedRepetitionItem[];
      setSrItems(items);
      setStatistics(calculateStatistics(items));
      setDueItems(getDueItems(items, 20));
      setUpcomingItems(getUpcomingItems(items, 7));
    } catch (error) {
      console.error("Error fetching SR items:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch curriculums for adding topics
  const fetchCurriculums = useCallback(async () => {
    if (!user) return;

    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        [Query.equal("userId", user.$id)],
      );
      setCurriculums(response.documents as unknown as Curriculum[]);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  }, [user]);

  // Fetch subjects for selected curriculum
  const fetchSubjects = useCallback(
    async (curriculumId: string) => {
      if (!user) return;

      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          [
            Query.equal("userId", user.$id),
            Query.equal("curriculumId", curriculumId),
          ],
        );
        setSubjects(response.documents as unknown as Subject[]);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    },
    [user],
  );

  // Fetch topics for selected subject
  const fetchTopics = useCallback(
    async (subjectId: string) => {
      if (!user) return;

      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.TOPICS,
          [
            Query.equal("userId", user.$id),
            Query.equal("subjectId", subjectId),
          ],
        );
        setTopics(response.documents as unknown as Topic[]);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    },
    [user],
  );

  useEffect(() => {
    if (user) {
      fetchSRItems();
      fetchCurriculums();
      fetchUserSettings();
    }
  }, [user, fetchSRItems, fetchCurriculums, fetchUserSettings]);

  useEffect(() => {
    if (selectedCurriculum) {
      fetchSubjects(selectedCurriculum);
      setSelectedSubject("");
      setTopics([]);
    }
  }, [selectedCurriculum, fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    }
  }, [selectedSubject, fetchTopics]);

  // Add topic to spaced repetition
  const addTopicToSR = async (topic: Topic) => {
    if (!user) return;

    // Check if already exists
    const exists = srItems.some((item) => item.topicId === topic.$id);
    if (exists) {
      alert("This topic is already in your review list");
      return;
    }

    try {
      setAddingTopics(true);

      const curriculum = curriculums.find((c) => c.$id === selectedCurriculum);
      const subject = subjects.find((s) => s.$id === selectedSubject);

      // Use user settings or defaults
      const settings = userSettings || DEFAULT_SR_SETTINGS;

      // Determine first interval based on user's review mode
      const isCustomMode = settings.reviewMode === "custom";
      let firstInterval = 1;

      if (isCustomMode) {
        const intervals = getIntervalsFromPattern(
          settings.selectedPatternId,
          settings.customIntervals,
        );
        firstInterval = intervals[0] || 1;
      }

      const firstReviewDate = new Date();
      firstReviewDate.setDate(firstReviewDate.getDate() + firstInterval);
      firstReviewDate.setHours(0, 0, 0, 0);

      await databases.createDocument(
        DB_ID,
        COLLECTIONS.SPACED_REPETITION,
        ID.unique(),
        {
          userId: user.$id,
          topicId: topic.$id,
          subjectId: topic.subjectId,
          curriculumId: topic.curriculumId,
          topicName: topic.name,
          subjectName: subject?.name || "",
          curriculumName: curriculum?.name || "",
          easeFactor: 2.5,
          interval: firstInterval,
          repetitions: 0,
          nextReviewDate: firstReviewDate.toISOString(),
          totalReviews: 0,
          correctReviews: 0,
          status: "active",
          emailReminderSent: false,
          // Custom pattern fields
          reviewMode: settings.reviewMode || "sm2",
          patternId: isCustomMode ? settings.selectedPatternId : null,
          customIntervals:
            isCustomMode && settings.selectedPatternId === "custom"
              ? settings.customIntervals
              : null,
          currentStep: 0,
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      );

      await fetchSRItems();
    } catch (error) {
      console.error("Error adding topic to SR:", error);
    } finally {
      setAddingTopics(false);
    }
  };

  // Submit review for SM-2 mode
  const submitReview = async (quality: ReviewQuality) => {
    if (!user || dueItems.length === 0) return;

    const currentItem = dueItems[currentReviewIndex];

    try {
      const result = calculateNextReview(
        currentItem.easeFactor,
        currentItem.interval,
        currentItem.repetitions,
        quality,
      );

      const isCorrect = quality >= 3;

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.SPACED_REPETITION,
        currentItem.$id,
        {
          easeFactor: result.newEaseFactor,
          interval: result.newInterval,
          repetitions: result.newRepetitions,
          nextReviewDate: result.nextReviewDate.toISOString(),
          lastReviewDate: new Date().toISOString(),
          totalReviews: (currentItem.totalReviews || 0) + 1,
          correctReviews:
            (currentItem.correctReviews || 0) + (isCorrect ? 1 : 0),
          emailReminderSent: false,
        },
      );

      // Move to next item or complete
      if (currentReviewIndex < dueItems.length - 1) {
        setCurrentReviewIndex(currentReviewIndex + 1);
        setShowAnswer(false);
      } else {
        setReviewComplete(true);
        await fetchSRItems();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  // Submit review for custom pattern mode (fixed intervals)
  const submitPatternReview = async (remembered: boolean) => {
    if (!user || dueItems.length === 0) return;

    const currentItem = dueItems[currentReviewIndex];
    const settings = userSettings || DEFAULT_SR_SETTINGS;
    const patternId = currentItem.patternId || settings.selectedPatternId;
    const customIntervalsStr =
      currentItem.customIntervals || settings.customIntervals;
    const currentStep = currentItem.currentStep || 0;

    // Get the intervals array from pattern
    const intervals = getIntervalsFromPattern(patternId, customIntervalsStr);

    try {
      const result = calculateCustomPatternReview(
        currentStep,
        intervals,
        remembered,
      );

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.SPACED_REPETITION,
        currentItem.$id,
        {
          interval: result.newInterval,
          nextReviewDate: result.nextReviewDate.toISOString(),
          lastReviewDate: new Date().toISOString(),
          totalReviews: (currentItem.totalReviews || 0) + 1,
          correctReviews:
            (currentItem.correctReviews || 0) + (remembered ? 1 : 0),
          currentStep: result.newStep,
          emailReminderSent: false,
        },
      );

      // Move to next item or complete
      if (currentReviewIndex < dueItems.length - 1) {
        setCurrentReviewIndex(currentReviewIndex + 1);
        setShowAnswer(false);
      } else {
        setReviewComplete(true);
        await fetchSRItems();
      }
    } catch (error) {
      console.error("Error submitting pattern review:", error);
    }
  };

  // Submit review with manual interval selection
  const submitManualReview = async (days: number) => {
    if (!user || dueItems.length === 0) return;

    const currentItem = dueItems[currentReviewIndex];

    try {
      const result = calculateManualReview(days);

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.SPACED_REPETITION,
        currentItem.$id,
        {
          interval: result.newInterval,
          nextReviewDate: result.nextReviewDate.toISOString(),
          lastReviewDate: new Date().toISOString(),
          totalReviews: (currentItem.totalReviews || 0) + 1,
          correctReviews: (currentItem.correctReviews || 0) + 1,
          emailReminderSent: false,
        },
      );

      // Move to next item or complete
      if (currentReviewIndex < dueItems.length - 1) {
        setCurrentReviewIndex(currentReviewIndex + 1);
        setShowAnswer(false);
      } else {
        setReviewComplete(true);
        await fetchSRItems();
      }
    } catch (error) {
      console.error("Error submitting manual review:", error);
    }
  };

  // Remove item from SR
  const removeFromSR = async (itemId: string) => {
    if (!confirm("Remove this topic from spaced repetition?")) return;

    try {
      await databases.deleteDocument(
        DB_ID,
        COLLECTIONS.SPACED_REPETITION,
        itemId,
      );
      await fetchSRItems();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Start review session
  const startReview = () => {
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewComplete(false);
    setViewMode("review");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-400" />
              Spaced Repetition
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Review topics at optimal intervals for long-term retention
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("settings")}
              className={clsx(
                "p-2 rounded-xl border transition-all",
                viewMode === "settings"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("add")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Topics
            </button>
          </div>
        </div>

        {viewMode === "dashboard" && (
          <>
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.dueToday}
                      </p>
                      <p className="text-sm text-zinc-500">Due Today</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <Calendar className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.dueThisWeek}
                      </p>
                      <p className="text-sm text-zinc-500">This Week</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.averageRetention}%
                      </p>
                      <p className="text-sm text-zinc-500">Retention</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.activeItems}
                      </p>
                      <p className="text-sm text-zinc-500">Active Topics</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Start Review Button */}
            {dueItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-8 mb-8 shadow-xl shadow-indigo-500/10 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Ready to Review!
                    </h2>
                    <p className="text-indigo-100/80">
                      You have {dueItems.length} topic
                      {dueItems.length > 1 ? "s" : ""} due for review
                    </p>
                  </div>
                  <button
                    onClick={startReview}
                    className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg"
                  >
                    Start Review
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Due Items List */}
            {dueItems.length > 0 && (
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  Due for Review
                </h3>
                <div className="space-y-3">
                  {dueItems.slice(0, 5).map((item) => (
                    <div
                      key={item.$id}
                      className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {item.topicName}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {item.curriculumName} → {item.subjectName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2 py-1 rounded">
                          {item.totalReviews} reviews
                        </span>
                        <button
                          onClick={() => removeFromSR(item.$id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Items */}
            {upcomingItems.length > 0 && (
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  Coming Up This Week
                </h3>
                <div className="space-y-3">
                  {upcomingItems.slice(0, 5).map((item) => {
                    const reviewDate = new Date(item.nextReviewDate);
                    const daysUntil = Math.ceil(
                      (reviewDate.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <div
                        key={item.$id}
                        className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {item.topicName}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {item.curriculumName} → {item.subjectName}
                          </p>
                        </div>
                        <span className="text-sm text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20 font-medium">
                          {formatInterval(daysUntil)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {srItems.length === 0 && (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  No Topics Yet
                </h3>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Add topics from your curriculum to start building your personalized review
                  schedule
                </p>
                <button
                  onClick={() => setViewMode("add")}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Topic
                </button>
              </div>
            )}
          </>
        )}

        {viewMode === "review" && (
          <div className="max-w-xl mx-auto">
            {!reviewComplete ? (
              <motion.div
                key={currentReviewIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl"
              >
                {/* Progress */}
                <div className="bg-black/20 p-6 flex items-center justify-between border-b border-white/5">
                  <span className="text-sm text-zinc-400 font-medium">
                    Card {currentReviewIndex + 1} <span className="text-zinc-600">/</span> {dueItems.length}
                  </span>
                  <div className="w-32 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      style={{
                        width: `${((currentReviewIndex + 1) / dueItems.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-8 md:p-10 text-center">
                  <p className="text-xs font-bold tracking-wider text-indigo-400 uppercase mb-3 bg-indigo-500/10 inline-block px-3 py-1 rounded-full border border-indigo-500/20">
                    {dueItems[currentReviewIndex].curriculumName} • {dueItems[currentReviewIndex].subjectName}
                  </p>
                  <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                    {dueItems[currentReviewIndex].topicName}
                  </h2>

                  {!showAnswer ? (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl w-full"
                    >
                      Show Answer
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Check if current item uses custom pattern or SM-2 */}
                      {dueItems[currentReviewIndex].reviewMode === "custom" ? (
                        // Custom Pattern Review UI
                        <div>
                          <p className="text-zinc-300 mb-6 text-lg">
                            Did you remember this topic?
                          </p>

                          {/* Simple Yes/No buttons for pattern-based review */}
                          <div className="flex gap-4 justify-center mb-8">
                            <button
                              onClick={() => submitPatternReview(false)}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-2 w-1/2 justify-center"
                            >
                              <X className="w-5 h-5" />
                              Forgot
                            </button>
                            <button
                              onClick={() => submitPatternReview(true)}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-2 w-1/2 justify-center"
                            >
                              <Check className="w-5 h-5" />
                              Remembered
                            </button>
                          </div>

                          {/* Manual interval selection */}
                          <div className="border-t border-white/5 pt-6">
                            <p className="text-sm text-zinc-500 mb-4">
                              Or set interval manually:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {[1, 3, 7, 14, 30, 60, 90].map((days) => (
                                <button
                                  key={days}
                                  onClick={() => submitManualReview(days)}
                                  className="bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg text-sm transition-colors border border-white/5"
                                >
                                  {days === 1 ? "1d" : `${days}d`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Show current pattern info */}
                          <div className="mt-6 text-xs text-zinc-600 font-mono">
                            Pattern:{" "}
                            {PRESET_PATTERNS.find(
                              (p) =>
                                p.id === dueItems[currentReviewIndex].patternId,
                            )?.name || "Standard"}
                            {dueItems[currentReviewIndex].currentStep !==
                              undefined && (
                              <>
                                {" "}
                                • Step{" "}
                                {(dueItems[currentReviewIndex].currentStep ||
                                  0) + 1}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        // SM-2 Algorithm Review UI
                        <div>
                          <p className="text-zinc-300 mb-6 text-lg">
                            How well did you remember this topic?
                          </p>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                              {
                                quality: ReviewQuality.BLACKOUT,
                                label: "Forget",
                                color: "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30",
                              },
                              {
                                quality: ReviewQuality.HARD,
                                label: "Hard",
                                color: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
                              },
                              {
                                quality: ReviewQuality.DIFFICULT,
                                label: "Difficult",
                                color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30",
                              },
                              {
                                quality: ReviewQuality.GOOD,
                                label: "Good",
                                color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30",
                              },
                              {
                                quality: ReviewQuality.PERFECT,
                                label: "Easy",
                                color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30",
                              },
                            ].map((option) => {
                              const preview = calculateNextReview(
                                dueItems[currentReviewIndex].easeFactor,
                                dueItems[currentReviewIndex].interval,
                                dueItems[currentReviewIndex].repetitions,
                                option.quality,
                              );
                              return (
                                <button
                                  key={option.quality}
                                  onClick={() => submitReview(option.quality)}
                                  className={`${option.color} border p-4 rounded-xl font-medium transition-all transform hover:-translate-y-1 hover:shadow-lg`}
                                >
                                  <span className="block mb-1">{option.label}</span>
                                  <span className="text-xs opacity-60 font-mono block">
                                    {formatInterval(preview.newInterval)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 rounded-3xl border border-white/5 p-12 text-center backdrop-blur-sm shadow-2xl"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Review Complete!
                </h2>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                  Great job! You reviewed {dueItems.length} topic
                  {dueItems.length > 1 ? "s" : ""}. Keep up the momentum!
                </p>
                <button
                  onClick={() => setViewMode("dashboard")}
                  className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 shadow-xl"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}
          </div>
        )}

        {viewMode === "add" && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setViewMode("dashboard")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-semibold text-white">
                Add Topics to Spaced Repetition
              </h2>
            </div>

            <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 backdrop-blur-sm space-y-6">
              {/* Curriculum Select */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Select Curriculum
                </label>
                <div className="relative">
                  <select
                    value={selectedCurriculum}
                    onChange={(e) => setSelectedCurriculum(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="" className="bg-zinc-900">Choose a curriculum...</option>
                    {curriculums.map((c) => (
                      <option key={c.$id} value={c.$id} className="bg-zinc-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Subject Select */}
              {selectedCurriculum && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-white font-medium mb-2">
                    Select Subject
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="" className="bg-zinc-900">Choose a subject...</option>
                      {subjects.map((s) => (
                        <option key={s.$id} value={s.$id} className="bg-zinc-900">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Topics List */}
              {selectedSubject && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-white font-medium mb-2">
                    Select Topics to Add
                  </label>
                  {topics.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                      <p className="text-zinc-400">
                        No topics found in this subject
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {topics.map((topic) => {
                        const alreadyAdded = srItems.some(
                          (item) => item.topicId === topic.$id,
                        );
                        return (
                          <div
                            key={topic.$id}
                            className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div>
                              <p className="text-white font-medium">{topic.name}</p>
                              {topic.description && (
                                <p className="text-sm text-zinc-400">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                            {alreadyAdded ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-sm flex items-center gap-1 font-medium">
                                <Check className="w-4 h-4" />
                                Added
                              </span>
                            ) : (
                              <button
                                onClick={() => addTopicToSR(topic)}
                                disabled={addingTopics}
                                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {addingTopics ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Plus className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {viewMode === "settings" && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setViewMode("dashboard")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-semibold text-white">Settings</h2>
            </div>
            <SpacedRepetitionSettings />
          </div>
        )}
      </div>
    </main>
  );
}

export default function SpacedRepetitionPage() {
  return (
    <ProtectedRoute>
      <SpacedRepetitionContent />
    </ProtectedRoute>
  );
}
