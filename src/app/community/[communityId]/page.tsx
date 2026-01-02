"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  databases,
  DB_ID,
  COLLECTIONS,
  storage,
  POST_IMAGES_BUCKET_ID,
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
}

interface Comment {
  $id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
  author?: any;
}

export default function CommunityViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const communityId = params?.communityId as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Post creation
  const [postContent, setPostContent] = useState("");
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

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      loadPosts();
      checkMembership();
    }
  }, [communityId, user]);

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
      const response = await databases.listDocuments(DB_ID, COLLECTIONS.POSTS, [
        Query.equal("communityId", communityId),
        Query.orderDesc("createdAt"),
        Query.limit(50),
      ]);

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
        setIsMember(true);
        setMembershipId(response.documents[0].$id);
      } else {
        setIsMember(false);
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
      const membership = await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMUNITY_MEMBERS,
        ID.unique(),
        {
          communityId,
          userId: user.$id,
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        [Permission.read(Role.any()), Permission.delete(Role.user(user.$id))]
      );

      // Update member count
      if (community) {
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.COMMUNITIES,
          communityId,
          { memberCount: community.memberCount + 1 }
        );
      }

      setIsMember(true);
      setMembershipId(membership.$id);
      loadCommunity();
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

      // Update member count
      if (community) {
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.COMMUNITIES,
          communityId,
          { memberCount: Math.max(0, community.memberCount - 1) }
        );
      }

      setIsMember(false);
      setMembershipId("");
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

  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) return;

    setPosting(true);

    try {
      // Upload images if any
      const imageUrls: string[] = [];
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
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      setPostContent("");
      setSelectedImages([]);
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

  const handleAddComment = async (postId: string, currentComments: number) => {
    if (!user || !commentText[postId]?.trim()) return;

    try {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.COMMENTS,
        ID.unique(),
        {
          postId,
          authorId: user.$id,
          content: commentText[postId],
          likes: 0,
          createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      await databases.updateDocument(DB_ID, COLLECTIONS.POSTS, postId, {
        comments: currentComments + 1,
      });

      setCommentText({ ...commentText, [postId]: "" });
      await loadComments(postId);
      loadPosts();
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
            ) : (
              <button
                onClick={handleJoin}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Join
              </button>
            )}
          </div>
        </div>

        {/* Create Post (only for members) */}
        {isMember && (
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share something with the community..."
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all resize-none mb-3"
              rows={3}
              maxLength={5000}
            />

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
            posts.map((post) => (
              <div
                key={post.$id}
                className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
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
                      <p className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">
                        {post.author?.username || "Unknown"}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {formatTime(post.createdAt)}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Post Content */}
                <p className="text-zinc-300 text-sm mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

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
                    {activeComments[post.$id]?.map((comment) => (
                      <div key={comment.$id} className="flex gap-3 mb-3">
                        <Link href={`/profile/${comment.authorId}`}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {comment.author?.profilePicture ? (
                              <img
                                src={comment.author.profilePicture}
                                alt={comment.author.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-xs">
                                {comment.author?.username?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1">
                          <div className="bg-zinc-900/50 rounded-xl px-3 py-2">
                            <Link href={`/profile/${comment.authorId}`}>
                              <p className="text-white font-medium text-xs mb-1 hover:text-indigo-400">
                                {comment.author?.username || "Unknown"}
                              </p>
                            </Link>
                            <p className="text-zinc-300 text-xs">
                              {comment.content}
                            </p>
                          </div>
                          <p className="text-zinc-600 text-[10px] mt-1 ml-3">
                            {formatTime(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    {isMember && (
                      <div className="flex gap-3 mt-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <span className="text-white text-xs">
                            {user?.name?.[0]?.toUpperCase()}
                          </span>
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
                                handleAddComment(post.$id, post.comments);
                              }
                            }}
                          />
                          <button
                            onClick={() =>
                              handleAddComment(post.$id, post.comments)
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
