"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID, Permission, Role } from "appwrite";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Plus,
  Loader2,
  X,
  Download,
  Star,
  Clock,
  Users,
  Upload,
  CheckCircle,
  Filter,
  ArrowRight,
  Sparkles,
  Tag,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
  List,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface PublicCurriculum {
  $id: string;
  userId: string;
  username: string;
  name: string;
  description?: string;
  category: string;
  targetHours?: number;
  subjects?: string;
  status: "pending" | "approved" | "rejected";
  downloads: number;
  rating?: number;
  ratingCount?: number;
  submittedAt: string;
  tags?: string;
}

interface NewSubject {
  id: string;
  name: string;
  description: string;
  color: string;
  targetHours: number;
  topics: string[]; // Array of topic names
}

interface UserRating {
  curriculumId: string;
  rating: number;
}

const CATEGORIES = [
  "Science",
  "Mathematics",
  "Computer Science",
  "Engineering",
  "Medicine",
  "Law",
  "Business",
  "Arts & Humanities",
  "Languages",
  "Test Prep",
  "Other",
];

const COLOR_OPTIONS = [
  { value: "#6366f1", name: "Indigo" },
  { value: "#ef4444", name: "Red" },
  { value: "#10b981", name: "Emerald" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#ec4899", name: "Pink" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#84cc16", name: "Lime" },
];

export default function PublicCurriculumPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [curricula, setCurricula] = useState<PublicCurriculum[]>([]);
  const [myCurricula, setMyCurricula] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createMode, setCreateMode] = useState<"existing" | "new">("existing");

  // Submit form state (existing curriculum)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // New curriculum creation state
  const [newCurriculumName, setNewCurriculumName] = useState("");
  const [newCurriculumDescription, setNewCurriculumDescription] = useState("");
  const [newCurriculumTargetHours, setNewCurriculumTargetHours] = useState(0);
  const [newSubjects, setNewSubjects] = useState<NewSubject[]>([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#6366f1");
  const [newSubjectTargetHours, setNewSubjectTargetHours] = useState(0);
  const [newSubjectTopics, setNewSubjectTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    null
  );

  // Rating state
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [ratingCurriculumId, setRatingCurriculumId] = useState<string | null>(
    null
  );
  const [pendingRating, setPendingRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Edit state
  const [editingCurriculum, setEditingCurriculum] =
    useState<PublicCurriculum | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit subject state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectDescription, setEditSubjectDescription] = useState("");
  const [editSubjectColor, setEditSubjectColor] = useState("#6366f1");
  const [editSubjectTargetHours, setEditSubjectTargetHours] = useState(0);
  const [editSubjectTopics, setEditSubjectTopics] = useState<string[]>([]);
  const [editTopicInput, setEditTopicInput] = useState("");

  useEffect(() => {
    loadCurricula();
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      loadMyCurricula();
      loadUserRatings();
    }
  }, [user]);

  const loadCurricula = async () => {
    try {
      const queries = [
        Query.equal("status", "approved"),
        Query.orderDesc("downloads"),
        Query.limit(50),
      ];

      if (selectedCategory) {
        queries.push(Query.equal("category", selectedCategory));
      }

      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PUBLIC_CURRICULUM,
        queries
      );
      setCurricula(response.documents as any);
    } catch (err) {
      console.error("Error loading curricula:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCurricula = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        [Query.equal("userId", user!.$id)]
      );
      setMyCurricula(response.documents);
    } catch (err) {
      console.error("Error loading my curricula:", err);
    }
  };

  const loadUserRatings = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM_RATINGS,
        [Query.equal("userId", user!.$id)]
      );
      setUserRatings(
        response.documents.map((d: any) => ({
          curriculumId: d.curriculumId,
          rating: d.rating,
        }))
      );
    } catch (err) {
      console.error("Error loading user ratings:", err);
    }
  };

  const handleRate = async (curriculumId: string, rating: number) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setSubmittingRating(true);
    try {
      // Check if user already rated this curriculum
      const existingRating = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM_RATINGS,
        [
          Query.equal("userId", user.$id),
          Query.equal("curriculumId", curriculumId),
        ]
      );

      const curriculum = curricula.find((c) => c.$id === curriculumId);
      if (!curriculum) return;

      const currentRating = curriculum.rating || 0;
      const currentCount = curriculum.ratingCount || 0;

      let newRating: number;
      let newCount: number;

      if (existingRating.documents.length > 0) {
        // Update existing rating
        const oldRating = existingRating.documents[0].rating;
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.CURRICULUM_RATINGS,
          existingRating.documents[0].$id,
          { rating }
        );
        // Recalculate average
        newRating =
          (currentRating * currentCount - oldRating + rating) / currentCount;
        newCount = currentCount;
      } else {
        // Create new rating
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.CURRICULUM_RATINGS,
          ID.unique(),
          {
            userId: user.$id,
            curriculumId,
            rating,
            createdAt: new Date().toISOString(),
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );
        // Calculate new average
        newCount = currentCount + 1;
        newRating = (currentRating * currentCount + rating) / newCount;
      }

      // Update curriculum rating
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.PUBLIC_CURRICULUM,
        curriculumId,
        {
          rating: Math.round(newRating * 10) / 10,
          ratingCount: newCount,
        }
      );

      // Update local state
      setUserRatings((prev) => {
        const existing = prev.find((r) => r.curriculumId === curriculumId);
        if (existing) {
          return prev.map((r) =>
            r.curriculumId === curriculumId ? { ...r, rating } : r
          );
        }
        return [...prev, { curriculumId, rating }];
      });

      setRatingCurriculumId(null);
      setPendingRating(0);
      loadCurricula();
    } catch (err) {
      console.error("Error rating curriculum:", err);
      alert("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const getUserRating = (curriculumId: string) => {
    return (
      userRatings.find((r) => r.curriculumId === curriculumId)?.rating || 0
    );
  };

  const addTopicToNewSubject = () => {
    if (!newTopicInput.trim()) return;
    const newTopics = [...newSubjectTopics, newTopicInput.trim()];
    setNewSubjectTopics(newTopics);
    setNewTopicInput("");
    return newTopics;
  };

  // Add subject with option to include pending topic
  const addSubjectWithPendingTopic = () => {
    if (!newSubjectName.trim()) return;

    // Include any pending topic that hasn't been added yet
    let finalTopics = newSubjectTopics;
    if (newTopicInput.trim()) {
      finalTopics = [...newSubjectTopics, newTopicInput.trim()];
    }

    setNewSubjects([
      ...newSubjects,
      {
        id: ID.unique(),
        name: newSubjectName.trim(),
        description: newSubjectDescription.trim(),
        color: newSubjectColor,
        targetHours: newSubjectTargetHours,
        topics: finalTopics,
      },
    ]);
    setNewSubjectName("");
    setNewSubjectDescription("");
    setNewSubjectColor("#6366f1");
    setNewSubjectTargetHours(0);
    setNewSubjectTopics([]);
    setNewTopicInput("");
    setShowAddSubject(false);
  };

  const removeTopicFromNewSubject = (index: number) => {
    setNewSubjectTopics(newSubjectTopics.filter((_, i) => i !== index));
  };

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    setNewSubjects([
      ...newSubjects,
      {
        id: ID.unique(),
        name: newSubjectName.trim(),
        description: newSubjectDescription.trim(),
        color: newSubjectColor,
        targetHours: newSubjectTargetHours,
        topics: newSubjectTopics,
      },
    ]);
    setNewSubjectName("");
    setNewSubjectDescription("");
    setNewSubjectColor("#6366f1");
    setNewSubjectTargetHours(0);
    setNewSubjectTopics([]);
    setShowAddSubject(false);
  };

  const removeSubject = (id: string) => {
    setNewSubjects(newSubjects.filter((s) => s.id !== id));
    if (editingSubjectId === id) {
      cancelEditSubject();
    }
  };

  // Edit subject functions
  const startEditSubject = (subject: NewSubject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name);
    setEditSubjectDescription(subject.description);
    setEditSubjectColor(subject.color);
    setEditSubjectTargetHours(subject.targetHours);
    setEditSubjectTopics([...subject.topics]);
    setEditTopicInput("");
    setExpandedSubjectId(subject.id);
  };

  const cancelEditSubject = () => {
    setEditingSubjectId(null);
    setEditSubjectName("");
    setEditSubjectDescription("");
    setEditSubjectColor("#6366f1");
    setEditSubjectTargetHours(0);
    setEditSubjectTopics([]);
    setEditTopicInput("");
  };

  const saveEditSubject = () => {
    if (!editingSubjectId || !editSubjectName.trim()) return;

    setNewSubjects(
      newSubjects.map((s) =>
        s.id === editingSubjectId
          ? {
              ...s,
              name: editSubjectName.trim(),
              description: editSubjectDescription.trim(),
              color: editSubjectColor,
              targetHours: editSubjectTargetHours,
              topics: editSubjectTopics,
            }
          : s
      )
    );
    cancelEditSubject();
  };

  const addEditTopic = () => {
    if (!editTopicInput.trim()) return;
    const newTopics = [...editSubjectTopics, editTopicInput.trim()];
    setEditSubjectTopics(newTopics);
    setEditTopicInput("");
    return newTopics;
  };

  // Save edit subject with option to include pending topic
  const saveEditSubjectWithPendingTopic = () => {
    if (!editingSubjectId || !editSubjectName.trim()) return;

    // Include any pending topic that hasn't been added yet
    let finalTopics = editSubjectTopics;
    if (editTopicInput.trim()) {
      finalTopics = [...editSubjectTopics, editTopicInput.trim()];
    }

    setNewSubjects(
      newSubjects.map((s) =>
        s.id === editingSubjectId
          ? {
              ...s,
              name: editSubjectName.trim(),
              description: editSubjectDescription.trim(),
              color: editSubjectColor,
              targetHours: editSubjectTargetHours,
              topics: finalTopics,
            }
          : s
      )
    );
    cancelEditSubject();
  };

  const removeEditTopic = (index: number) => {
    setEditSubjectTopics(editSubjectTopics.filter((_, i) => i !== index));
  };

  const updateExistingTopic = (index: number, newValue: string) => {
    setEditSubjectTopics(
      editSubjectTopics.map((t, i) => (i === index ? newValue : t))
    );
  };

  const resetForm = () => {
    setSelectedCurriculumId("");
    setDescription("");
    setCategory("");
    setTags("");
    setNewCurriculumName("");
    setNewCurriculumDescription("");
    setNewCurriculumTargetHours(0);
    setNewSubjects([]);
    setShowAddSubject(false);
    setCreateMode("existing");
    setError("");
    setNewSubjectTopics([]);
    setNewTopicInput("");
    setExpandedSubjectId(null);
    setEditingCurriculum(null);
    cancelEditSubject();
  };

  const openEditModal = (curriculum: PublicCurriculum) => {
    setEditingCurriculum(curriculum);
    setNewCurriculumName(curriculum.name);
    setNewCurriculumDescription(curriculum.description || "");
    setNewCurriculumTargetHours(curriculum.targetHours || 0);
    setCategory(curriculum.category);
    setTags(curriculum.tags || "");

    // Parse subjects
    if (curriculum.subjects) {
      try {
        const subjects = JSON.parse(curriculum.subjects);
        setNewSubjects(
          subjects.map((s: any) => ({
            id: ID.unique(),
            name: s.name,
            description: s.description || "",
            color: s.color || "#6366f1",
            targetHours: s.targetHours || 0,
            topics: s.topics || [],
          }))
        );
      } catch {
        setNewSubjects([]);
      }
    }

    setShowEditModal(true);
  };

  const handleUpdateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCurriculum) return;

    setError("");
    setSubmitting(true);

    try {
      if (!newCurriculumName.trim()) {
        throw new Error("Curriculum name is required");
      }
      if (newSubjects.length === 0) {
        throw new Error("Add at least one subject");
      }
      if (!category) {
        throw new Error("Please select a category");
      }

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.PUBLIC_CURRICULUM,
        editingCurriculum.$id,
        {
          name: newCurriculumName.trim(),
          description: newCurriculumDescription.trim(),
          category,
          targetHours: newCurriculumTargetHours,
          subjects: JSON.stringify(
            newSubjects.map((s) => ({
              name: s.name,
              description: s.description,
              color: s.color,
              targetHours: s.targetHours,
              topics: s.topics || [],
            }))
          ),
          tags: tags,
        }
      );

      setSuccess(true);
      setTimeout(() => {
        setShowEditModal(false);
        setSuccess(false);
        resetForm();
        loadCurricula();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update curriculum");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setSubmitting(true);

    try {
      // Get profile for username
      const profileResponse = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", user.$id)]
      );
      const username = profileResponse.documents[0]?.username || "Anonymous";

      if (createMode === "new") {
        // Create from scratch
        if (!newCurriculumName.trim()) {
          throw new Error("Curriculum name is required");
        }
        if (newSubjects.length === 0) {
          throw new Error("Add at least one subject");
        }

        await databases.createDocument(
          DB_ID,
          COLLECTIONS.PUBLIC_CURRICULUM,
          ID.unique(),
          {
            userId: user.$id,
            username,
            name: newCurriculumName.trim(),
            description: newCurriculumDescription.trim() || description,
            category,
            targetHours: newCurriculumTargetHours,
            subjects: JSON.stringify(
              newSubjects.map((s) => ({
                name: s.name,
                description: s.description,
                color: s.color,
                targetHours: s.targetHours,
                topics: s.topics || [],
              }))
            ),
            status: "approved",
            downloads: 0,
            rating: 0,
            ratingCount: 0,
            submittedAt: new Date().toISOString(),
            tags: tags,
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );
      } else {
        // Share existing curriculum
        if (!selectedCurriculumId) {
          throw new Error("Please select a curriculum");
        }

        const selectedCurr = myCurricula.find(
          (c) => c.$id === selectedCurriculumId
        );
        if (!selectedCurr) throw new Error("Curriculum not found");

        // Fetch subjects for this curriculum
        const subjectsResponse = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          [Query.equal("curriculumId", selectedCurriculumId)]
        );

        await databases.createDocument(
          DB_ID,
          COLLECTIONS.PUBLIC_CURRICULUM,
          ID.unique(),
          {
            userId: user.$id,
            username,
            name: selectedCurr.name,
            description: description || selectedCurr.description,
            category,
            targetHours: selectedCurr.targetHours || 0,
            subjects: JSON.stringify(
              subjectsResponse.documents.map((s: any) => ({
                name: s.name,
                description: s.description,
                color: s.color,
                targetHours: s.targetHours,
              }))
            ),
            status: "approved",
            downloads: 0,
            rating: 0,
            ratingCount: 0,
            submittedAt: new Date().toISOString(),
            tags: tags,
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );
      }

      setSuccess(true);
      setTimeout(() => {
        setShowSubmitModal(false);
        setSuccess(false);
        resetForm();
        loadCurricula();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit curriculum");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (curriculum: PublicCurriculum) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      // Parse subjects
      const subjects = curriculum.subjects
        ? JSON.parse(curriculum.subjects)
        : [];

      // Create curriculum for user
      const newCurriculum = await databases.createDocument(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        ID.unique(),
        {
          userId: user.$id,
          name: curriculum.name,
          description: curriculum.description || "",
          targetHours: curriculum.targetHours || 0,
          //   completedHours: 0,
          $createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      // Create subjects for the curriculum
      for (const subject of subjects) {
        const newSubject = await databases.createDocument(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          ID.unique(),
          {
            userId: user.$id,
            curriculumId: newCurriculum.$id,
            name: subject.name,
            description: subject.description || "",
            color: subject.color || "#6366f1",
            targetHours: subject.targetHours || 0,
            order: 0,
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );

        // Create topics for this subject if they exist
        if (subject.topics && Array.isArray(subject.topics)) {
          for (let i = 0; i < subject.topics.length; i++) {
            const topicName = subject.topics[i];
            if (topicName && topicName.trim()) {
              await databases.createDocument(
                DB_ID,
                COLLECTIONS.TOPICS,
                ID.unique(),
                {
                  userId: user.$id,
                  subjectId: newSubject.$id,
                  curriculumId: newCurriculum.$id,
                  name: topicName.trim(),
                  description: "",
                  order: i,
                  completed: false,
                  studyTime: 0,
                },
                [
                  Permission.read(Role.user(user.$id)),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id)),
                ]
              );
            }
          }
        }
      }

      // Update download count
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.PUBLIC_CURRICULUM,
        curriculum.$id,
        {
          downloads: (curriculum.downloads || 0) + 1,
        }
      );

      alert("Curriculum added to your collection!");
      loadCurricula();
    } catch (err) {
      console.error("Error downloading curriculum:", err);
      alert("Failed to download curriculum");
    }
  };

  const filteredCurricula = curricula.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6">
            Public <span className="text-gradient">Curricula</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto">
            Browse community-shared curricula or share your own to help fellow
            learners.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search curricula..."
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-8 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (!user) {
                router.push("/login");
              } else {
                setShowSubmitModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Share Curriculum
          </button>
        </div>

        {/* Curricula Grid */}
        {filteredCurricula.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-2">
              {searchQuery || selectedCategory
                ? "No curricula found"
                : "No public curricula yet"}
            </p>
            <p className="text-zinc-600 text-sm mb-6">
              {searchQuery || selectedCategory
                ? "Try different search terms"
                : "Be the first to share your curriculum!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCurricula.map((curriculum, idx) => {
              const subjectsCount = curriculum.subjects
                ? JSON.parse(curriculum.subjects).length
                : 0;

              return (
                <motion.div
                  key={curriculum.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-indigo-500/30 transition-all group"
                >
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {user && curriculum.userId === user.$id && (
                      <button
                        onClick={() => openEditModal(curriculum)}
                        className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
                        title="Edit curriculum"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    <span className="px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
                      {curriculum.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                        <BookOpen className="text-indigo-400" width={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">
                          {curriculum.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          by {curriculum.username}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px]">
                      {curriculum.description || "No description provided"}
                    </p>

                    {/* Tags */}
                    {curriculum.tags && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {curriculum.tags
                          .split(",")
                          .slice(0, 3)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {subjectsCount} subjects
                      </span>
                      {curriculum.targetHours ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {curriculum.targetHours}h
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {curriculum.downloads || 0}
                      </span>
                      {(curriculum.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {curriculum.rating?.toFixed(1)} (
                          {curriculum.ratingCount})
                        </span>
                      )}
                    </div>

                    {/* Rating Section */}
                    <div className="mb-4">
                      {ratingCurriculumId === curriculum.$id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setPendingRating(star)}
                                className="p-0.5 hover:scale-110 transition-transform"
                                title={`Rate ${star} star${
                                  star > 1 ? "s" : ""
                                }`}
                              >
                                <Star
                                  className={clsx(
                                    "w-5 h-5 transition-colors",
                                    star <= pendingRating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-zinc-600"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() =>
                              handleRate(curriculum.$id, pendingRating)
                            }
                            disabled={pendingRating === 0 || submittingRating}
                            className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 disabled:opacity-50"
                          >
                            {submittingRating ? "..." : "Submit"}
                          </button>
                          <button
                            onClick={() => {
                              setRatingCurriculumId(null);
                              setPendingRating(0);
                            }}
                            className="px-2 py-1 text-zinc-500 hover:text-zinc-300 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) {
                              router.push("/login");
                              return;
                            }
                            setRatingCurriculumId(curriculum.$id);
                            setPendingRating(getUserRating(curriculum.$id));
                          }}
                          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={clsx(
                              "w-3 h-3",
                              getUserRating(curriculum.$id) > 0
                                ? "fill-amber-400 text-amber-400"
                                : ""
                            )}
                          />
                          {getUserRating(curriculum.$id) > 0
                            ? `Your rating: ${getUserRating(curriculum.$id)}`
                            : "Rate this"}
                        </button>
                      )}
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(curriculum)}
                      className="w-full py-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 border border-indigo-500/20 hover:border-transparent"
                    >
                      <Download className="w-4 h-4" />
                      Add to My Curricula
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSubmitModal(false);
                resetForm();
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 px-4"
            >
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-white">
                        Share Your Curriculum
                      </h2>
                      <p className="text-sm text-zinc-500 mt-1">
                        Help others learn with your study plan
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowSubmitModal(false);
                        resetForm();
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {success ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Curriculum Shared!
                    </h3>
                    <p className="text-zinc-500">
                      Your curriculum is now available for others to use.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitCurriculum}
                    className="p-6 space-y-4"
                  >
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Toggle between modes */}
                    <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setCreateMode("existing")}
                        className={clsx(
                          "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                          createMode === "existing"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Share Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateMode("new")}
                        className={clsx(
                          "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                          createMode === "new"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Create New
                      </button>
                    </div>

                    {createMode === "existing" ? (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                          Select Curriculum to Share
                        </label>
                        <select
                          value={selectedCurriculumId}
                          onChange={(e) =>
                            setSelectedCurriculumId(e.target.value)
                          }
                          required={createMode === "existing"}
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                        >
                          <option value="">Select a curriculum...</option>
                          {myCurricula.map((c) => (
                            <option key={c.$id} value={c.$id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {myCurricula.length === 0 && (
                          <p className="text-xs text-zinc-500 mt-2">
                            No curricula found.{" "}
                            <Link
                              href="/curriculum"
                              className="text-indigo-400 hover:underline"
                            >
                              Create one first
                            </Link>{" "}
                            or switch to &quot;Create New&quot; mode.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">
                            Curriculum Name *
                          </label>
                          <input
                            type="text"
                            value={newCurriculumName}
                            onChange={(e) =>
                              setNewCurriculumName(e.target.value)
                            }
                            required={createMode === "new"}
                            placeholder="e.g., HSC Science Complete Guide"
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">
                            Target Hours Weekly (optional)
                          </label>
                          <input
                            type="number"
                            value={newCurriculumTargetHours || ""}
                            onChange={(e) =>
                              setNewCurriculumTargetHours(
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="e.g., 500"
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                          />
                        </div>

                        {/* Subjects Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-zinc-400">
                              Subjects *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowAddSubject(true)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Subject
                            </button>
                          </div>

                          {newSubjects.length === 0 ? (
                            <div className="p-4 border border-dashed border-zinc-700 rounded-xl text-center">
                              <p className="text-zinc-500 text-sm">
                                No subjects added yet
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowAddSubject(true)}
                                className="text-indigo-400 text-sm mt-1 hover:underline"
                              >
                                Add your first subject
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {newSubjects.map((subject) => (
                                <div
                                  key={subject.id}
                                  className={clsx(
                                    "bg-zinc-900/50 border rounded-lg overflow-hidden",
                                    editingSubjectId === subject.id
                                      ? "border-indigo-500/50"
                                      : "border-zinc-800"
                                  )}
                                >
                                  {editingSubjectId === subject.id ? (
                                    /* Edit Subject Form */
                                    <div className="p-3 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-indigo-400 font-medium">
                                          Editing Subject
                                        </span>
                                        <button
                                          type="button"
                                          onClick={cancelEditSubject}
                                          className="text-xs text-zinc-500 hover:text-white"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={editSubjectName}
                                        onChange={(e) =>
                                          setEditSubjectName(e.target.value)
                                        }
                                        placeholder="Subject name *"
                                        className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                      />
                                      <input
                                        type="text"
                                        value={editSubjectDescription}
                                        onChange={(e) =>
                                          setEditSubjectDescription(
                                            e.target.value
                                          )
                                        }
                                        placeholder="Description (optional)"
                                        className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <input
                                          type="number"
                                          value={editSubjectTargetHours || ""}
                                          onChange={(e) =>
                                            setEditSubjectTargetHours(
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          placeholder="Target hours"
                                          className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                        />
                                        <div className="flex gap-1">
                                          {COLOR_OPTIONS.slice(0, 4).map(
                                            (color) => (
                                              <button
                                                key={color.value}
                                                type="button"
                                                onClick={() =>
                                                  setEditSubjectColor(
                                                    color.value
                                                  )
                                                }
                                                className={clsx(
                                                  "w-8 h-8 rounded-lg transition-all",
                                                  editSubjectColor ===
                                                    color.value
                                                    ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                                    : ""
                                                )}
                                                style={{
                                                  backgroundColor: color.value,
                                                }}
                                                title={color.name}
                                              />
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Edit Topics */}
                                      <div className="border-t border-zinc-700 pt-3">
                                        <label className="text-xs text-zinc-500 mb-2 block">
                                          Topics/Chapters
                                        </label>
                                        {editSubjectTopics.length > 0 && (
                                          <div className="space-y-1 mb-2">
                                            {editSubjectTopics.map(
                                              (topic, idx) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-center gap-2"
                                                >
                                                  <input
                                                    type="text"
                                                    value={topic}
                                                    onChange={(e) =>
                                                      updateExistingTopic(
                                                        idx,
                                                        e.target.value
                                                      )
                                                    }
                                                    className="flex-1 bg-black/30 border border-zinc-700 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-indigo-500/50"
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      removeEditTopic(idx)
                                                    }
                                                    className="p-1 text-zinc-500 hover:text-red-400"
                                                    title="Remove topic"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={editTopicInput}
                                            onChange={(e) =>
                                              setEditTopicInput(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                addEditTopic();
                                              }
                                            }}
                                            placeholder="Add new topic..."
                                            className="flex-1 bg-black/30 border border-zinc-700 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-indigo-500/50"
                                          />
                                          <button
                                            type="button"
                                            onClick={addEditTopic}
                                            disabled={!editTopicInput.trim()}
                                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded"
                                            title="Add topic"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={
                                          saveEditSubjectWithPendingTopic
                                        }
                                        disabled={!editSubjectName.trim()}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded-lg"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  ) : (
                                    /* Subject Display */
                                    <>
                                      <div className="flex items-center justify-between p-3">
                                        <div
                                          className="flex items-center gap-3 flex-1 cursor-pointer"
                                          onClick={() =>
                                            setExpandedSubjectId(
                                              expandedSubjectId === subject.id
                                                ? null
                                                : subject.id
                                            )
                                          }
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: subject.color,
                                            }}
                                          />
                                          <div className="flex-1">
                                            <p className="text-sm text-white">
                                              {subject.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                              {subject.targetHours > 0 && (
                                                <span>
                                                  {subject.targetHours}h target
                                                </span>
                                              )}
                                              {subject.topics.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                  <List className="w-3 h-3" />
                                                  {subject.topics.length} topics
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {(subject.topics.length > 0 ||
                                            subject.description) &&
                                            (expandedSubjectId ===
                                            subject.id ? (
                                              <ChevronUp className="w-4 h-4 text-zinc-500" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              startEditSubject(subject)
                                            }
                                            className="p-1 hover:bg-indigo-500/10 rounded text-zinc-500 hover:text-indigo-400"
                                            title="Edit subject"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeSubject(subject.id)
                                            }
                                            className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400"
                                            title="Remove subject"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      {expandedSubjectId === subject.id && (
                                        <div className="px-3 pb-3 pt-0">
                                          {subject.description && (
                                            <p className="text-xs text-zinc-500 mb-2 pl-6">
                                              {subject.description}
                                            </p>
                                          )}
                                          {subject.topics.length > 0 && (
                                            <div className="pl-6 border-l border-zinc-700 space-y-1">
                                              {subject.topics.map(
                                                (topic, idx) => (
                                                  <p
                                                    key={idx}
                                                    className="text-xs text-zinc-400 py-1"
                                                  >
                                                    {topic}
                                                  </p>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Subject Form */}
                          <AnimatePresence>
                            {showAddSubject && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3"
                              >
                                <input
                                  type="text"
                                  value={newSubjectName}
                                  onChange={(e) =>
                                    setNewSubjectName(e.target.value)
                                  }
                                  placeholder="Subject name *"
                                  className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                                <input
                                  type="text"
                                  value={newSubjectDescription}
                                  onChange={(e) =>
                                    setNewSubjectDescription(e.target.value)
                                  }
                                  placeholder="Description (optional)"
                                  className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={newSubjectTargetHours || ""}
                                    onChange={(e) =>
                                      setNewSubjectTargetHours(
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="Target hours"
                                    className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                  />
                                  <div className="flex gap-1">
                                    {COLOR_OPTIONS.slice(0, 4).map((color) => (
                                      <button
                                        key={color.value}
                                        type="button"
                                        onClick={() =>
                                          setNewSubjectColor(color.value)
                                        }
                                        className={clsx(
                                          "w-8 h-8 rounded-lg transition-all",
                                          newSubjectColor === color.value
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                            : ""
                                        )}
                                        style={{ backgroundColor: color.value }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Topics Section */}
                                <div className="border-t border-zinc-700 pt-3">
                                  <label className="text-xs text-zinc-500 mb-2 block">
                                    Topics/Chapters (optional)
                                  </label>
                                  <div className="flex gap-2 mb-2">
                                    <input
                                      type="text"
                                      value={newTopicInput}
                                      onChange={(e) =>
                                        setNewTopicInput(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          addTopicToNewSubject();
                                        }
                                      }}
                                      placeholder="Add a topic..."
                                      className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50 text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={addTopicToNewSubject}
                                      disabled={!newTopicInput.trim()}
                                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded-lg"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {newSubjectTopics.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {newSubjectTopics.map((topic, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded"
                                        >
                                          {topic}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeTopicFromNewSubject(idx)
                                            }
                                            className="hover:text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAddSubject(false);
                                      setNewSubjectTopics([]);
                                      setNewTopicInput("");
                                    }}
                                    className="flex-1 py-2 text-sm text-zinc-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={addSubjectWithPendingTopic}
                                    disabled={!newSubjectName.trim()}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded-lg"
                                  >
                                    Add
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                      >
                        <option value="">Select a category...</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={
                          createMode === "new"
                            ? newCurriculumDescription
                            : description
                        }
                        onChange={(e) =>
                          createMode === "new"
                            ? setNewCurriculumDescription(e.target.value)
                            : setDescription(e.target.value)
                        }
                        placeholder="Describe your curriculum and who it's for..."
                        rows={3}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., beginner, exam prep, STEM"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        !category ||
                        (createMode === "existing" && !selectedCurriculumId) ||
                        (createMode === "new" &&
                          (!newCurriculumName.trim() ||
                            newSubjects.length === 0))
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Share Curriculum
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Edit Modal */}
        {showEditModal && editingCurriculum && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 px-4"
            >
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-white">
                        Edit Curriculum
                      </h2>
                      <p className="text-sm text-zinc-500 mt-1">
                        Update your public curriculum
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {success ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Curriculum Updated!
                    </h3>
                    <p className="text-zinc-500">
                      Your changes have been saved.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateCurriculum}
                    className="p-6 space-y-4"
                  >
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Curriculum Name *
                      </label>
                      <input
                        type="text"
                        value={newCurriculumName}
                        onChange={(e) => setNewCurriculumName(e.target.value)}
                        required
                        placeholder="e.g., HSC Science Complete Guide"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Target Hours Weekly (optional)
                      </label>
                      <input
                        type="number"
                        value={newCurriculumTargetHours || ""}
                        onChange={(e) =>
                          setNewCurriculumTargetHours(
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="e.g., 500"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                      />
                    </div>

                    {/* Subjects Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-zinc-400">
                          Subjects *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddSubject(true)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Subject
                        </button>
                      </div>

                      {newSubjects.length === 0 ? (
                        <div className="p-4 border border-dashed border-zinc-700 rounded-xl text-center">
                          <p className="text-zinc-500 text-sm">
                            No subjects added yet
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddSubject(true)}
                            className="text-indigo-400 text-sm mt-1 hover:underline"
                          >
                            Add your first subject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {newSubjects.map((subject) => (
                            <div
                              key={subject.id}
                              className={clsx(
                                "bg-zinc-900/50 border rounded-lg overflow-hidden",
                                editingSubjectId === subject.id
                                  ? "border-indigo-500/50"
                                  : "border-zinc-800"
                              )}
                            >
                              {editingSubjectId === subject.id ? (
                                /* Edit Subject Form */
                                <div className="p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-indigo-400 font-medium">
                                      Editing Subject
                                    </span>
                                    <button
                                      type="button"
                                      onClick={cancelEditSubject}
                                      className="text-xs text-zinc-500 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={editSubjectName}
                                    onChange={(e) =>
                                      setEditSubjectName(e.target.value)
                                    }
                                    placeholder="Subject name *"
                                    className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={editSubjectDescription}
                                    onChange={(e) =>
                                      setEditSubjectDescription(e.target.value)
                                    }
                                    placeholder="Description (optional)"
                                    className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      value={editSubjectTargetHours || ""}
                                      onChange={(e) =>
                                        setEditSubjectTargetHours(
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      placeholder="Target hours"
                                      className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                    />
                                    <div className="flex gap-1">
                                      {COLOR_OPTIONS.slice(0, 4).map(
                                        (color) => (
                                          <button
                                            key={color.value}
                                            type="button"
                                            onClick={() =>
                                              setEditSubjectColor(color.value)
                                            }
                                            className={clsx(
                                              "w-8 h-8 rounded-lg transition-all",
                                              editSubjectColor === color.value
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                                : ""
                                            )}
                                            style={{
                                              backgroundColor: color.value,
                                            }}
                                            title={color.name}
                                          />
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* Edit Topics */}
                                  <div className="border-t border-zinc-700 pt-3">
                                    <label className="text-xs text-zinc-500 mb-2 block">
                                      Topics/Chapters
                                    </label>
                                    {editSubjectTopics.length > 0 && (
                                      <div className="space-y-1 mb-2">
                                        {editSubjectTopics.map((topic, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <input
                                              type="text"
                                              value={topic}
                                              onChange={(e) =>
                                                updateExistingTopic(
                                                  idx,
                                                  e.target.value
                                                )
                                              }
                                              className="flex-1 bg-black/30 border border-zinc-700 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-indigo-500/50"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeEditTopic(idx)
                                              }
                                              className="p-1 text-zinc-500 hover:text-red-400"
                                              title="Remove topic"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={editTopicInput}
                                        onChange={(e) =>
                                          setEditTopicInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            addEditTopic();
                                          }
                                        }}
                                        placeholder="Add new topic..."
                                        className="flex-1 bg-black/30 border border-zinc-700 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-indigo-500/50"
                                      />
                                      <button
                                        type="button"
                                        onClick={addEditTopic}
                                        disabled={!editTopicInput.trim()}
                                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded"
                                        title="Add topic"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={saveEditSubjectWithPendingTopic}
                                    disabled={!editSubjectName.trim()}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded-lg"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              ) : (
                                /* Subject Display */
                                <>
                                  <div className="flex items-center justify-between p-3">
                                    <div
                                      className="flex items-center gap-3 flex-1 cursor-pointer"
                                      onClick={() =>
                                        setExpandedSubjectId(
                                          expandedSubjectId === subject.id
                                            ? null
                                            : subject.id
                                        )
                                      }
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: subject.color,
                                        }}
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm text-white">
                                          {subject.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                          {subject.targetHours > 0 && (
                                            <span>
                                              {subject.targetHours}h target
                                            </span>
                                          )}
                                          {subject.topics.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <List className="w-3 h-3" />
                                              {subject.topics.length} topics
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {(subject.topics.length > 0 ||
                                        subject.description) &&
                                        (expandedSubjectId === subject.id ? (
                                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startEditSubject(subject)
                                        }
                                        className="p-1 hover:bg-indigo-500/10 rounded text-zinc-500 hover:text-indigo-400"
                                        title="Edit subject"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSubject(subject.id)
                                        }
                                        className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400"
                                        title="Remove subject"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {expandedSubjectId === subject.id && (
                                    <div className="px-3 pb-3 pt-0">
                                      {subject.description && (
                                        <p className="text-xs text-zinc-500 mb-2 pl-6">
                                          {subject.description}
                                        </p>
                                      )}
                                      {subject.topics.length > 0 && (
                                        <div className="pl-6 border-l border-zinc-700 space-y-1">
                                          {subject.topics.map((topic, idx) => (
                                            <p
                                              key={idx}
                                              className="text-xs text-zinc-400 py-1"
                                            >
                                              {topic}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Subject Form (Edit Modal) */}
                      <AnimatePresence>
                        {showAddSubject && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3"
                          >
                            <input
                              type="text"
                              value={newSubjectName}
                              onChange={(e) =>
                                setNewSubjectName(e.target.value)
                              }
                              placeholder="Subject name *"
                              className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                            />
                            <input
                              type="text"
                              value={newSubjectDescription}
                              onChange={(e) =>
                                setNewSubjectDescription(e.target.value)
                              }
                              placeholder="Description (optional)"
                              className="w-full bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={newSubjectTargetHours || ""}
                                onChange={(e) =>
                                  setNewSubjectTargetHours(
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="Target hours"
                                className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                              />
                              <div className="flex gap-1">
                                {COLOR_OPTIONS.slice(0, 4).map((color) => (
                                  <button
                                    key={color.value}
                                    type="button"
                                    onClick={() =>
                                      setNewSubjectColor(color.value)
                                    }
                                    className={clsx(
                                      "w-8 h-8 rounded-lg transition-all",
                                      newSubjectColor === color.value
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                        : ""
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Topics Section */}
                            <div className="border-t border-zinc-700 pt-3">
                              <label className="text-xs text-zinc-500 mb-2 block">
                                Topics/Chapters (optional)
                              </label>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={newTopicInput}
                                  onChange={(e) =>
                                    setNewTopicInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addTopicToNewSubject();
                                    }
                                  }}
                                  placeholder="Add a topic..."
                                  className="flex-1 bg-black/30 border border-zinc-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500/50 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={addTopicToNewSubject}
                                  disabled={!newTopicInput.trim()}
                                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs rounded-lg"
                                  title="Add topic"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {newSubjectTopics.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {newSubjectTopics.map((topic, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded"
                                    >
                                      {topic}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeTopicFromNewSubject(idx)
                                        }
                                        className="hover:text-red-400"
                                        title="Remove topic"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddSubject(false);
                                  setNewSubjectTopics([]);
                                  setNewTopicInput("");
                                  setNewSubjectName("");
                                  setNewSubjectDescription("");
                                  setNewSubjectColor("#6366f1");
                                  setNewSubjectTargetHours(0);
                                }}
                                className="flex-1 py-2 text-sm text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={addSubjectWithPendingTopic}
                                disabled={!newSubjectName.trim()}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm rounded-lg"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                        title="Select category"
                      >
                        <option value="">Select a category...</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={newCurriculumDescription}
                        onChange={(e) =>
                          setNewCurriculumDescription(e.target.value)
                        }
                        placeholder="Describe your curriculum and who it's for..."
                        rows={3}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., beginner, exam prep, STEM"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        !category ||
                        !newCurriculumName.trim() ||
                        newSubjects.length === 0
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Pencil className="w-4 h-4" />
                          Update Curriculum
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
