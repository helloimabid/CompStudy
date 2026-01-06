"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID, Permission, Role } from "appwrite";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Loader2,
  X,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Lock,
  Globe,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";
import { storage, POST_IMAGES_BUCKET_ID } from "@/lib/appwrite";
import Link from "next/link";

interface Community {
  $id: string;
  name: string;
  description?: string;
  coverImage?: string;
  creatorId: string;
  memberCount: number;
  createdAt: string;
  isPrivate?: boolean;
  creator?: {
    $id: string;
    userId: string;
    userName: string;
    profilePicture?: string;
  };
}

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.COMMUNITIES,
        [Query.orderDesc("memberCount"), Query.limit(50)]
      );

      // Fetch creator profiles for each community
      const communitiesWithCreators = await Promise.all(
        response.documents.map(async (community: any) => {
          try {
            const profiles = await databases.listDocuments(
              DB_ID,
              COLLECTIONS.PROFILES,
              [Query.equal("userId", community.creatorId)]
            );
            return {
              ...community,
              creator: profiles.documents[0] || null,
            };
          } catch {
            return { ...community, creator: null };
          }
        })
      );

      setCommunities(communitiesWithCreators as any);
    } catch (err) {
      console.error("Error loading communities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPrivate(false);
    setCoverImage(null);
    setCoverPreview(null);
    setStep(1);
    setError("");
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setError("");
    setCreating(true);

    try {
      // Upload cover image if selected
      let coverImageUrl = "";
      if (coverImage) {
        const fileId = ID.unique();
        await storage.createFile(POST_IMAGES_BUCKET_ID, fileId, coverImage);
        coverImageUrl = storage
          .getFileView(POST_IMAGES_BUCKET_ID, fileId)
          .toString();
      }

      // Create community
      const community = await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMUNITIES,
        ID.unique(),
        {
          name,
          description,
          coverImage: coverImageUrl,
          creatorId: user.$id,
          memberCount: 1,
          createdAt: new Date().toISOString(),
          isPrivate,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      // Add creator as member
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        ID.unique(),
        {
          communityId: community.$id,
          userId: user.$id,
          role: "creator",
          joinedAt: new Date().toISOString(),
          status: "approved",
        },
        [Permission.read(Role.any()), Permission.delete(Role.user(user.$id))]
      );

      setShowCreateModal(false);
      resetForm();
      router.push(`/community/${community.$id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6">
            Study <span className="text-gradient">Communities</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto">
            Join communities, share knowledge, and connect with fellow learners
            around the world.
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
              placeholder="Search communities..."
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
            />
          </div>

          <button
            onClick={() => {
              if (!user) {
                router.push("/login");
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-100 text-black rounded-xl hover:bg-zinc-200 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Community
          </button>
        </div>

        {/* Communities Grid - Bento Style */}
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-2">
              {searchQuery ? "No communities found" : "No communities yet"}
            </p>
            <p className="text-zinc-600 text-sm mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Be the first to create one!"}
            </p>
            <button
              onClick={() =>
                !user ? router.push("/login") : setShowCreateModal(true)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-100 text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCommunities.map((community, idx) => (
              <Link href={`/community/${community.$id}`} key={community.$id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-indigo-500/30 transition-all cursor-pointer group h-full"
                >
                  {/* Cover Gradient */}
                  <div className="h-24 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent relative overflow-hidden">
                    {community.coverImage ? (
                      <img
                        src={community.coverImage}
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-10 h-10 text-indigo-400/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

                    {/* Privacy Badge */}
                    {community.isPrivate && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-amber-400 border border-amber-500/30">
                        <Lock className="w-3 h-3" />
                        Private
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 -mt-6 relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-md overflow-hidden">
                        {community.creator?.profilePicture ? (
                          <img
                            src={community.creator.profilePicture}
                            alt={community.creator.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MessageSquare
                            className="text-indigo-400"
                            width={18}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-full">
                          <Users className="w-3 h-3" />
                          {community.memberCount}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {community.name}
                    </h3>

                    {community.creator && (
                      <p className="text-xs text-zinc-600 mb-2">
                        by {community.creator.userName}
                      </p>
                    )}

                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px]">
                      {community.description || "No description"}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(community.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:gap-2 transition-all">
                        View
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => {
              if (!creating) {
                setShowCreateModal(false);
                resetForm();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Create Community
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Step {step} of 2</p>
                </div>
                {!creating && (
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
                <motion.div
                  initial={{ width: "50%" }}
                  animate={{ width: step === 1 ? "50%" : "100%" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateCommunity} className="space-y-5">
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Community Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                        placeholder="e.g., Medical Students Hub"
                        required
                        maxLength={100}
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none"
                        placeholder="What is this community about?"
                        rows={3}
                        maxLength={500}
                        disabled={creating}
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        {description.length}/500 characters
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!name.trim()}
                      className="w-full bg-zinc-800 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Cover Image
                      </label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer ${
                          coverPreview
                            ? "border-indigo-500/50"
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                        onClick={() =>
                          document.getElementById("cover-input")?.click()
                        }
                      >
                        {coverPreview ? (
                          <div className="relative h-32">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCoverImage(null);
                                setCoverPreview(null);
                              }}
                              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center text-zinc-500">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs">
                              Click to upload cover image
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        id="cover-input"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageSelect}
                        className="hidden"
                        disabled={creating}
                      />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isPrivate ? (
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-amber-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <Globe className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {isPrivate
                                ? "Private Community"
                                : "Public Community"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {isPrivate
                                ? "Members need approval to join"
                                : "Anyone can join instantly"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPrivate(!isPrivate)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            isPrivate ? "bg-amber-500" : "bg-zinc-700"
                          }`}
                        >
                          <motion.div
                            initial={false}
                            animate={{ x: isPrivate ? 24 : 2 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                      <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                        Preview
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center overflow-hidden border border-white/10">
                          {coverPreview ? (
                            <img
                              src={coverPreview}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-indigo-400/50" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {name || "Community Name"}
                            </p>
                            {isPrivate && (
                              <Lock className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-1">
                            {description || "No description"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={creating}
                        className="flex-1 bg-zinc-800 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50"
                      >
                        Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={creating || !name}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-3 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Create
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
