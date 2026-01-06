"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  databases,
  DB_ID,
  COLLECTIONS,
  storage,
  POST_IMAGES_BUCKET_ID,
  client,
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID, Permission, Role } from "appwrite";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  MessageSquare,
  Heart,
  Share2,
  Image as ImageIcon,
  Loader2,
  Send,
  Trash2,
  MoreVertical,
  X,
  Pin,
  Check,
  Shield,
  Flag,
  BarChart2,
  Clock,
} from "lucide-react";
import Link from "next/link";
export const runtime = "edge";

interface Community {
  $id: string;
  name: string;
  description?: string;
  coverImage?: string;
  creatorId: string;
  memberCount: number;
  createdAt: string;
  isPrivate?: boolean;
}

interface Post {
  $id: string;
  communityId: string;
  authorId: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
  author?: any;
  userHasLiked?: boolean;
  isPinned?: boolean;
  type?: "text" | "poll";
  pollOptions?: string[];
  pollVotes?: string[]; // Array of strings like "optionIndex:userId" to track votes
}

interface Comment {
  $id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
  author?: any;
  parentId?: string; // For threaded comments
  replies?: Comment[]; // Helper for UI
}

interface Member {
  $id: string;
  communityId: string;
  userId: string;
  role: string;
  joinedAt: string;
  status: string; // 'approved' | 'pending' | 'banned'
  userName?: string;
  profile?: Profile;
}

interface Profile {
  $id: string;
  userId: string;
  username: string;
  profilePicture?: string;
}

export default function CommunityViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const communityId = params?.communityId as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string>("guest");
  const [membershipId, setMembershipId] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Members Management
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Post creation
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"text" | "poll">("text");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments
  const [activeComments, setActiveComments] = useState<{
    [key: string]: Comment[];
  }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<
    "discussion" | "members" | "media" | "about"
  >("discussion");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "likes">("newest");
  const [activePostMenu, setActivePostMenu] = useState<string | null>(null);

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      checkMembership();
    }
  }, [communityId, user]);

  useEffect(() => {
    if (communityId) {
      loadPosts();
    }
  }, [communityId, user, sortBy]);

  // Realtime Updates
  useEffect(() => {
    if (!communityId) return;

    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.POSTS}.documents`,
      async (response) => {
        const payload = response.payload as Post;
        if (payload.communityId !== communityId) return;

        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          // Check if we already have this post (local optimistic update might have added it)
          // But wait, my createPost does reloadPosts(), so it might duplicate if I am not careful.
          // Appwrite Realtime will fire for my own actions too? Yes.
          // Usually better to rely on Realtime and not manual reload, OR handling deduplication.
          // Simple dedup:
          setPosts((prev) => {
            if (prev.some((p) => p.$id === payload.$id)) return prev;
            // Need to fetch author
            return prev; // We can't fetch async inside setState updater safely without side effects or complexity.
          });

          // Actually, let's just trigger loadPosts if it's simpler, or handle it properly.
          // Fetching author async:
          try {
            const profiles = await databases.listDocuments(
              DB_ID,
              COLLECTIONS.PROFILES,
              [Query.equal("userId", payload.authorId)]
            );
            const newPost = {
              ...payload,
              author: profiles.documents[0],
            };
            setPosts((prev) => {
              if (prev.some((p) => p.$id === newPost.$id)) return prev;
              return [newPost, ...prev];
            });
          } catch (e) {
            console.error(e);
          }
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          setPosts((prev) => prev.filter((p) => p.$id !== payload.$id));
        } else if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          setPosts((prev) =>
            prev.map((p) => {
              if (p.$id === payload.$id) {
                // Preserve author and userHasLiked (which is client-side derived state usually, wait userHasLiked is derived on load)
                // If update is just likes count, userHasLiked shouldn't change unless *I* liked it.
                return {
                  ...p,
                  ...payload,
                  author: p.author,
                  userHasLiked: p.userHasLiked,
                };
              }
              return p;
            })
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [communityId]);

  useEffect(() => {
    if (communityId && activeTab === "members") {
      loadMembers();
    }
  }, [communityId, activeTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        [Query.equal("communityId", communityId), Query.limit(100)]
      );

      const membersWithProfiles = await Promise.all(
        response.documents.map(async (doc: any) => {
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", doc.userId)]
          );
          return { ...doc, profile: profiles.documents[0] };
        })
      );

      setMembers(membersWithProfiles);
    } catch (err) {
      console.error("Error loading members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleUpdateMemberStatus = async (
    memberId: string,
    newStatus: string
  ) => {
    try {
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        memberId,
        {
          status: newStatus,
        }
      );

      // Sync member count from actual members
      await syncMemberCount();
      loadCommunity();
      loadMembers();
    } catch (err) {
      console.error("Error updating member status:", err);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        memberId,
        {
          role: newRole,
        }
      );
      loadMembers();
    } catch (err) {
      console.error("Error updating member role:", err);
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to kick this member?")) return;
    try {
      await databases.deleteDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        memberId
      );
      // Sync member count from actual members
      await syncMemberCount();
      loadCommunity();
      loadMembers();
    } catch (err) {
      console.error("Error kicking member:", err);
    }
  };

  // Helper function to sync member count from actual members
  const syncMemberCount = async () => {
    try {
      const membersResponse = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        [
          Query.equal("communityId", communityId),
          Query.equal("status", "approved"),
          Query.limit(1000), // Get all to count
        ]
      );

      const actualCount = membersResponse.total;

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.COMMUNITIES,
        communityId,
        { memberCount: actualCount }
      );

      return actualCount;
    } catch (err) {
      console.error("Error syncing member count:", err);
      return null;
    }
  };

  const loadCommunity = async () => {
    try {
      const response = await databases.getDocument(
        DB_ID,
        COLLECTIONS.COMMUNITIES,
        communityId
      );
      setCommunity(response as any);
    } catch (err) {
      console.error("Error loading community:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const queries = [
        Query.equal("communityId", communityId),
        Query.orderDesc("isPinned"),
        sortBy === "likes"
          ? Query.orderDesc("likes")
          : Query.orderDesc("createdAt"),
        Query.limit(50),
      ];

      if (searchQuery) {
        // Note: 'content' attribute needs full-text index in Appwrite
        queries.push(Query.search("content", searchQuery));
      }

      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.POSTS,
        queries
      );

      // Load author profiles
      const postsWithAuthors = await Promise.all(
        response.documents.map(async (post: any) => {
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", post.authorId)]
          );

          // Check if user liked this post
          let userHasLiked = false;
          if (user) {
            const reactions = await databases.listDocuments(
              DB_ID,
              COLLECTIONS.REACTIONS,
              [
                Query.equal("targetId", post.$id),
                Query.equal("userId", user.$id),
                Query.equal("targetType", "post"),
              ]
            );
            userHasLiked = reactions.documents.length > 0;
          }

          return {
            ...post,
            author: profiles.documents[0],
            userHasLiked,
          };
        })
      );

      setPosts(postsWithAuthors);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };

  const checkMembership = async () => {
    if (!user) {
      setIsMember(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        [
          Query.equal("communityId", communityId),
          Query.equal("userId", user.$id),
        ]
      );

      if (response.documents.length > 0) {
        setMembershipId(response.documents[0].$id);
        setUserRole(response.documents[0].role || "member");
        const status = response.documents[0].status || "approved";
        setMembershipStatus(status);
        setIsMember(status === "approved");
      } else {
        setIsMember(false);
        setUserRole("guest");
        setMembershipStatus("");
      }
    } catch (err) {
      console.error("Error checking membership:", err);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const status = community?.isPrivate ? "pending" : "approved";

      const membership = await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        ID.unique(),
        {
          communityId,
          userId: user.$id,
          role: "member",
          joinedAt: new Date().toISOString(),
          status: status,
        },
        [Permission.read(Role.any()), Permission.delete(Role.user(user.$id))]
      );

      // Sync member count from actual members if approved
      if (status === "approved") {
        await syncMemberCount();
      }

      setMembershipId(membership.$id);
      setMembershipStatus(status);
      setIsMember(status === "approved");

      if (status === "approved") {
        loadCommunity();
      } else {
        alert("Request sent! Waiting for approval.");
      }
    } catch (err: any) {
      console.error("Error joining community:", err);
    }
  };

  const handleLeave = async () => {
    if (!membershipId) return;

    try {
      await databases.deleteDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        membershipId
      );

      // Sync member count from actual members
      await syncMemberCount();

      setIsMember(false);
      setMembershipId("");
      setUserRole("guest");
      loadCommunity();
    } catch (err: any) {
      console.error("Error leaving community:", err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 4) {
      alert("Maximum 4 images allowed");
      return;
    }
    setSelectedImages([
      ...selectedImages,
      ...files.slice(0, 4 - selectedImages.length),
    ]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handlePinPost = async (postId: string, currentPinStatus: boolean) => {
    if (!["admin", "moderator", "creator"].includes(userRole)) return;
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
        isPinned: !currentPinStatus,
      });
      loadPosts();
    } catch (err) {
      console.error("Error pinning post:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.POSTS, postId);
      loadPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleVotePoll = async (
    postId: string,
    optionIndex: number,
    currentVotes: string[] = []
  ) => {
    if (!user) return;

    // Check if user already voted
    const userVote = currentVotes.find((v) => v.split(":")[1] === user.$id);
    let newVotes = [...currentVotes];

    if (userVote) {
      // Remove previous vote
      newVotes = newVotes.filter((v) => v !== userVote);
    }

    // Add new vote
    newVotes.push(`${optionIndex}:${user.$id}`);

    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
        pollVotes: newVotes,
      });
      loadPosts();
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!postContent.trim() && postType === "text")) return;
    if (
      postType === "poll" &&
      (!postContent.trim() || pollOptions.some((opt) => !opt.trim()))
    )
      return;

    setPosting(true);

    try {
      // Upload images if any
      const imageUrls: string[] = [];
      if (postType === "text") {
        for (const file of selectedImages) {
          const fileId = ID.unique();
          const uploaded = await storage.createFile(
            POST_IMAGES_BUCKET_ID,
            fileId,
            file
          );
          const url = storage.getFileView(POST_IMAGES_BUCKET_ID, uploaded.$id);
          imageUrls.push(url.toString());
        }
      }

      // Create post
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.POSTS,
        ID.unique(),
        {
          communityId,
          authorId: user.$id,
          content: postContent,
          images: imageUrls,
          likes: 0,
          comments: 0,
          createdAt: new Date().toISOString(),
          isPinned: false,
          type: postType,
          pollOptions: postType === "poll" ? pollOptions : [],
          pollVotes: [],
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      setPostContent("");
      setSelectedImages([]);
      setPostType("text");
      setPollOptions(["", ""]);
      loadPosts();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (
    postId: string,
    currentLikes: number,
    userHasLiked: boolean
  ) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (userHasLiked) {
        // Unlike
        const reactions = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.REACTIONS,
          [
            Query.equal("targetId", postId),
            Query.equal("userId", user.$id),
            Query.equal("targetType", "post"),
          ]
        );

        if (reactions.documents.length > 0) {
          await databases.deleteDocument(
            DB_ID,
            COLLECTIONS.REACTIONS,
            reactions.documents[0].$id
          );
          await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
            likes: Math.max(0, currentLikes - 1),
          });
        }
      } else {
        // Like
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.REACTIONS,
          ID.unique(),
          {
            targetId: postId,
            targetType: "post",
            userId: user.$id,
            type: "like",
            createdAt: new Date().toISOString(),
          },
          [Permission.read(Role.any()), Permission.delete(Role.user(user.$id))]
        );

        await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
          likes: currentLikes + 1,
        });
      }

      loadPosts();
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.COMMENTS,
        [Query.equal("postId", postId), Query.orderAsc("createdAt")]
      );

      const commentsWithAuthors = await Promise.all(
        response.documents.map(async (comment: any) => {
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", comment.authorId)]
          );
          return { ...comment, author: profiles.documents[0] };
        })
      );

      setActiveComments({ ...activeComments, [postId]: commentsWithAuthors });
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const toggleComments = async (postId: string) => {
    const isShowing = showComments[postId];
    setShowComments({ ...showComments, [postId]: !isShowing });

    if (!isShowing && !activeComments[postId]) {
      await loadComments(postId);
    }
  };

  const handleAddComment = async (
    postId: string,
    content: string,
    parentId: string | null = null
  ) => {
    if (!user || !content.trim()) return;

    try {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMENTS,
        ID.unique(),
        {
          postId,
          authorId: user.$id,
          content,
          likes: 0,
          createdAt: new Date().toISOString(),
          parentId: parentId,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      const post = posts.find((p) => p.$id === postId);
      if (post) {
        await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
          comments: (post.comments || 0) + 1,
        });

        setPosts((prev) =>
          prev.map((p) =>
            p.$id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
          )
        );
      }

      await loadComments(postId);

      if (parentId) {
        setActiveReplyId(null);
        setReplyText("");
      } else {
        setCommentText({ ...commentText, [postId]: "" });
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Community not found</p>
          <button
            onClick={() => router.push("/community")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Go back to communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Cover + Header */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

        <button
          onClick={() => router.push("/community")}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        {/* Community Info Card */}
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {community.name}
              </h1>
              <p className="text-zinc-400 text-sm mb-3">
                {community.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{community.memberCount} members</span>
                </div>
              </div>
            </div>

            {isMember ? (
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                Leave
              </button>
            ) : membershipStatus === "pending" ? (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl cursor-default"
              >
                <Clock className="w-4 h-4" />
                Requested
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {community.isPrivate ? "Request to Join" : "Join"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {(["discussion", "members", "media", "about"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {activeTab === "discussion" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPosts()}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-4 pr-10 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
              >
                <option value="newest">Newest</option>
                <option value="likes">Top Rated</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === "discussion" && (
          <>
            {/* Create Post (only for members) */}
            {isMember && (
              <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setPostType("text")}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                      postType === "text"
                        ? "text-white border-indigo-500"
                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setPostType("poll")}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                      postType === "poll"
                        ? "text-white border-indigo-500"
                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    Poll
                  </button>
                </div>

                {postType === "text" ? (
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share something with the community..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none mb-3"
                    rows={3}
                    maxLength={5000}
                  />
                ) : (
                  <div className="space-y-3 mb-3">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                      rows={2}
                    />
                    <div className="space-y-2">
                      {pollOptions.map((option, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...pollOptions];
                              newOptions[idx] = e.target.value;
                              setPollOptions(newOptions);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              onClick={() =>
                                setPollOptions(
                                  pollOptions.filter((_, i) => i !== idx)
                                )
                              }
                              className="p-2 text-zinc-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 5 && (
                        <button
                          onClick={() => setPollOptions([...pollOptions, ""])}
                          className="text-sm text-indigo-400 hover:text-indigo-300 pl-1"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Previews */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedImages.length >= 4}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">
                      Add Photos ({selectedImages.length}/4)
                    </span>
                  </button>

                  <button
                    onClick={handleCreatePost}
                    disabled={posting || !postContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-16 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">
                    No posts yet. {isMember && "Be the first to post!"}
                  </p>
                </div>
              ) : (
                posts.map((post) => {
                  const totalVotes = post.pollVotes?.length || 0;
                  return (
                    <div
                      key={post.$id}
                      className={`bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-2xl p-6 ${
                        post.isPinned
                          ? "border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          : "border-white/10"
                      }`}
                    >
                      {/* Pinned Indicator */}
                      {post.isPinned && (
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-3">
                          <Pin className="w-3 h-3 fill-indigo-400" />
                          Pinned Post
                        </div>
                      )}

                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/profile/${post.authorId}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden">
                              {post.author?.profilePicture ? (
                                <img
                                  src={post.author.profilePicture}
                                  alt={post.author.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-medium text-sm">
                                  {post.author?.username?.[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">
                                  {post.author?.username || "Unknown"}
                                </p>
                                {community.creatorId === post.authorId && (
                                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs">
                                {formatTime(post.createdAt)}
                              </p>
                            </div>
                          </Link>
                        </div>

                        {/* Admin Tools */}
                        {["admin", "moderator", "creator"].includes(
                          userRole
                        ) && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActivePostMenu(
                                  activePostMenu === post.$id ? null : post.$id
                                )
                              }
                              className="text-zinc-500 hover:text-white transition-colors p-1"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activePostMenu === post.$id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 py-1">
                                <button
                                  onClick={() => {
                                    handlePinPost(
                                      post.$id,
                                      post.isPinned || false
                                    );
                                    setActivePostMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                >
                                  <Pin className="w-4 h-4" />
                                  {post.isPinned ? "Unpin Post" : "Pin Post"}
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeletePost(post.$id);
                                    setActivePostMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="text-zinc-300 text-sm mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Poll Rendering */}
                      {post.type === "poll" && post.pollOptions && (
                        <div className="space-y-2 mb-4">
                          {post.pollOptions.map((option, idx) => {
                            const votesForOption =
                              post.pollVotes?.filter((v) =>
                                v.startsWith(`${idx}:`)
                              ).length || 0;
                            const percentage =
                              totalVotes > 0
                                ? Math.round(
                                    (votesForOption / totalVotes) * 100
                                  )
                                : 0;
                            const hasVoted = post.pollVotes?.some(
                              (v) => v === `${idx}:${user?.$id}`
                            );

                            return (
                              <button
                                key={idx}
                                onClick={() =>
                                  handleVotePoll(post.$id, idx, post.pollVotes)
                                }
                                disabled={!user}
                                className="relative w-full h-10 bg-zinc-900/50 rounded-lg overflow-hidden border border-white/5 hover:border-white/10 transition-all group/poll"
                              >
                                {/* Progress Bar */}
                                <div
                                  className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />

                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                  <span
                                    className={`text-sm font-medium z-10 ${
                                      hasVoted
                                        ? "text-indigo-400"
                                        : "text-zinc-300"
                                    }`}
                                  >
                                    {option}
                                    {hasVoted && (
                                      <Check className="w-3 h-3 inline ml-2" />
                                    )}
                                  </span>
                                  <span className="text-xs text-zinc-500 z-10">
                                    {percentage}% ({votesForOption})
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                          <div className="text-xs text-zinc-500 text-right mt-1">
                            {totalVotes} votes
                          </div>
                        </div>
                      )}

                      {/* Post Images */}
                      {post.images && post.images.length > 0 && (
                        <div
                          className={`grid gap-2 mb-4 ${
                            post.images.length === 1
                              ? "grid-cols-1"
                              : post.images.length === 2
                              ? "grid-cols-2"
                              : post.images.length === 3
                              ? "grid-cols-3"
                              : "grid-cols-2"
                          }`}
                        >
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <button
                          onClick={() =>
                            handleLikePost(
                              post.$id,
                              post.likes,
                              post.userHasLiked || false
                            )
                          }
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            post.userHasLiked
                              ? "text-red-500"
                              : "text-zinc-400 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.userHasLiked ? "fill-current" : ""
                            }`}
                          />
                          <span>{post.likes}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(post.$id)}
                          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-indigo-400 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>

                        <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-green-400 transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[post.$id] && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          {activeComments[post.$id]
                            ?.filter((c) => !c.parentId)
                            .map((comment) => (
                              <CommentItem
                                key={comment.$id}
                                comment={comment}
                                allComments={activeComments[post.$id]}
                                onReply={handleAddComment}
                                activeReplyId={activeReplyId}
                                setActiveReplyId={setActiveReplyId}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                postId={post.$id}
                                formatTime={formatTime}
                              />
                            ))}

                          {/* Add Comment */}
                          {isMember && (
                            <div className="flex gap-3 mt-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {userProfile?.profilePicture ? (
                                  <img
                                    src={userProfile.profilePicture}
                                    alt={userProfile.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-xs">
                                    {user?.name
                                      ? user.name.charAt(0).toUpperCase()
                                      : "A"}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={commentText[post.$id] || ""}
                                  onChange={(e) =>
                                    setCommentText({
                                      ...commentText,
                                      [post.$id]: e.target.value,
                                    })
                                  }
                                  placeholder="Write a comment..."
                                  className="flex-1 bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 text-xs"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddComment(
                                        post.$id,
                                        commentText[post.$id]
                                      );
                                    }
                                  }}
                                />
                                <button
                                  title="addComment"
                                  onClick={() =>
                                    handleAddComment(
                                      post.$id,
                                      commentText[post.$id]
                                    )
                                  }
                                  disabled={!commentText[post.$id]?.trim()}
                                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 text-xs"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Other Tabs */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Members ({members.filter((m) => m.status === "approved").length}
                )
              </h2>
            </div>
            {["admin", "creator"].includes(userRole) &&
              members.filter((m) => m.status === "pending").length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                    Pending Requests (
                    {members.filter((m) => m.status === "pending").length})
                  </h3>
                  <div className="grid gap-4">
                    {members
                      .filter((m) => m.status === "pending")
                      .map((member) => (
                        <div
                          key={member.$id}
                          className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                        >
                          <Link
                            href={`/profile/${member.userId}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold overflow-hidden">
                              {member.profile?.profilePicture ? (
                                <img
                                  src={member.profile.profilePicture}
                                  alt={member.profile.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                member.profile?.username
                                  ?.charAt(0)
                                  .toUpperCase() || "?"
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {member.profile?.username || "Unknown"}
                              </div>
                              <div className="text-sm text-zinc-500">
                                Requested{" "}
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateMemberStatus(member.$id, "approved")
                              }
                              className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleKickMember(member.$id)}
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            <div className="grid gap-4">
              {members
                .filter((m) => m.status === "approved")
                .map((member) => (
                  <div
                    key={member.$id}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                  >
                    <Link
                      href={`/profile/${member.userId}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 overflow-hidden">
                        {member.profile?.profilePicture ? (
                          <img
                            src={member.profile.profilePicture}
                            alt={member.profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.profile?.username?.charAt(0).toUpperCase() ||
                          "?"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {member.profile?.username || "Unknown"}
                          </span>
                          {member.role === "creator" && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded border border-amber-500/20">
                              Owner
                            </span>
                          )}
                          {member.role === "admin" && (
                            <span className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/20">
                              Admin
                            </span>
                          )}
                          {member.role === "moderator" && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded border border-purple-500/20">
                              Mod
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-500">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>

                    {["admin", "creator"].includes(userRole) &&
                      member.userId !== user?.$id &&
                      member.role !== "creator" && (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(
                                member.$id,
                                e.target.value as
                                  | "member"
                                  | "moderator"
                                  | "admin"
                              )
                            }
                            className="bg-black border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to remove ${
                                    member.profile?.username || "this member"
                                  }?`
                                )
                              ) {
                                handleKickMember(member.$id);
                              }
                            }}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>
        )}
        {activeTab === "media" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Media Gallery
            </h2>
            {posts.filter((p) => p.images && p.images.length > 0).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts
                  .filter((p) => p.images && p.images.length > 0)
                  .map((post) => (
                    <div
                      key={post.$id}
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group cursor-pointer"
                      onClick={() => {
                        // Ideally open a lightbox or scroll to post
                        document
                          .getElementById(`post-${post.$id}`)
                          ?.scrollIntoView({ behavior: "smooth" });
                        setActiveTab("discussion");
                      }}
                    >
                      <img
                        src={post.images![0]}
                        alt="Community upload"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          View Post
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-800/50">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No media shared yet</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "about" && community && (
          <div className="bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              About {community.name}
            </h2>
            <p className="text-zinc-300 font-light leading-relaxed">
              {community.description}
            </p>
            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{community.memberCount} Members</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <UserPlus className="w-4 h-4" />
                <span>
                  Created {new Date(community.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CommentItem({
  comment,
  allComments,
  onReply,
  activeReplyId,
  setActiveReplyId,
  replyText,
  setReplyText,
  postId,
  formatTime,
}: {
  comment: any;
  allComments: any[];
  onReply: (postId: string, content: string, parentId: string) => void;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  postId: string;
  formatTime: (date: string) => string;
}) {
  const replies = allComments.filter((c: any) => c.parentId === comment.$id);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-3 mb-1">
        <Link href={`/profile/${comment.authorId}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {comment.author?.profilePicture ? (
              <img
                src={comment.author.profilePicture}
                alt={comment.author.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs">
                {comment.author?.userName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1">
          <div className="bg-zinc-900/50 rounded-xl px-3 py-2 border border-zinc-800/50">
            <div className="flex justify-between items-start">
              <Link href={`/profile/${comment.authorId}`}>
                <p className="text-white font-medium text-xs mb-1 hover:text-indigo-400">
                  {comment.author?.userName || "Unknown"}
                </p>
              </Link>
              <span className="text-zinc-600 text-[10px]">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-zinc-300 text-xs">{comment.content}</p>
          </div>
          <div className="flex gap-4 mt-1 ml-2">
            <button
              className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors"
              onClick={() => {
                if (activeReplyId === comment.$id) {
                  setActiveReplyId(null);
                } else {
                  setActiveReplyId(comment.$id);
                  setReplyText("");
                }
              }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {activeReplyId === comment.$id && (
        <div className="ml-11 flex gap-2 items-start mb-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500/50 resize-none"
            rows={1}
          />
          <button
            onClick={() => onReply(postId, replyText, comment.$id)}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-4 sm:ml-8 border-l-2 border-zinc-800 pl-4 space-y-3 mt-1">
          {replies.map((reply: any) => (
            <CommentItem
              key={reply.$id}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyText={replyText}
              setReplyText={setReplyText}
              postId={postId}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}
