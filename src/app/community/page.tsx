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
} from "lucide-react";
import Link from "next/link";

interface Community {
  $id: string;
  name: string;
  description?: string;
  coverImage?: string;
  creatorId: string;
  memberCount: number;
  createdAt: string;
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
  const [error, setError] = useState("");

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
      setCommunities(response.documents as any);
    } catch (err) {
      console.error("Error loading communities:", err);
    } finally {
      setLoading(false);
    }
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
      // Create community
      const community = await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMUNITIES,
        ID.unique(),
        {
          name,
          description,
          creatorId: user.$id,
          memberCount: 1,
          createdAt: new Date().toISOString(),
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
        },
        [Permission.read(Role.any()), Permission.delete(Role.user(user.$id))]
      );

      setShowCreateModal(false);
      setName("");
      setDescription("");
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
                  </div>

                  {/* Content */}
                  <div className="p-5 -mt-6 relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <MessageSquare className="text-indigo-400" width={18} />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {community.memberCount}
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {community.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px]">
                      {community.description || "No description"}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Active</span>
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
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Create Community
                </h2>
                {!creating && (
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    placeholder="Enter community name"
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
                    rows={4}
                    maxLength={500}
                    disabled={creating}
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={creating || !name}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-3.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Community
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
