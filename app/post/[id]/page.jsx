"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPostByIdFirestore,
  addCommentFirestore,
  addLikeFirestore,
  removeLikeFirestore,
  addReplyFirestore,
  addNestedReplyFirestore,
} from "@/libs/firestore";
import { getMediaURL } from "@/libs/firebase-storage";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import CommentThread from "@/components/CommentThread";

export default function PostPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [postLoading, setPostLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const formatLikesCount = (likes) => {
    if (!likes || likes.length === 0) {
      return null;
    }
    if (likes.length === 1) {
      return "1 like";
    }
    return `${likes.length} likes`;
  };

  const countTotalComments = (comments) => {
    if (!comments || comments.length === 0) {
      return 0;
    }

    let total = comments.length; // Count parent comments

    // Recursively count nested comments
    comments.forEach((comment) => {
      if (comment.comments && comment.comments.length > 0) {
        total += countTotalComments(comment.comments);
      }
    });

    return total;
  };

  const formatCommentsCount = (comments) => {
    const total = countTotalComments(comments);
    if (total === 0) {
      return null;
    }
    if (total === 1) {
      return "1 comment";
    }
    return `${total} comments`;
  };

  const loadMediaUrl = async (mediaPath, mediaType) => {
    if (!mediaPath) return;

    try {
      const url = await getMediaURL(mediaPath, mediaType || "image");
      if (url) {
        setMediaUrl(url);
        setMediaType(mediaType || "image");
      }
    } catch (error) {
      console.error("Error loading media:", error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const hasLiked = post?.likes?.includes(user.uid);

      if (hasLiked) {
        await removeLikeFirestore(postId, user.uid);
      } else {
        await addLikeFirestore(postId, user.uid);
      }

      // Refresh post to show updated likes
      const updatedPost = await getPostByIdFirestore(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const commentData = {
        comment: commentText.trim(),
        userId: user.uid,
        userImage: user.photoURL || "/avatar.jpg",
        userName: user.displayName || user.email,
      };

      await addCommentFirestore(postId, commentData);
      setCommentText("");

      // Refresh post to show new comment
      const updatedPost = await getPostByIdFirestore(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshPost = async () => {
    try {
      const updatedPost = await getPostByIdFirestore(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error("Error refreshing post:", error);
    }
  };

  useEffect(() => {
    async function fetchPost() {
      try {
        setPostLoading(true);
        const postData = await getPostByIdFirestore(postId);
        setPost(postData);

        // Load media URL if post has media
        if (postData?.media) {
          await loadMediaUrl(postData.media, postData.mediaType || "image");
        }
        // Backward compatibility for old 'image' field
        else if (postData?.image) {
          await loadMediaUrl(postData.image, "image");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        router.push("/");
      } finally {
        setPostLoading(false);
      }
    }

    if (postId) {
      fetchPost();
    }
  }, [postId, router]);

  if (loading || postLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Post not found
          </h2>
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Posts
        </button>

        {/* Post */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          {/* Post Header */}
          <div className="flex items-center mb-3">
            <div className="relative">
              <Image
                src={post.userImage || "/avatar.jpg"}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-gray-900">
                {post.userName || "Anonymous"}
              </h3>
              <p className="text-sm text-gray-500">
                {post.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "Just now"}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed mb-3">{post.post}</p>

            {/* Post Media */}
            {post.media && mediaUrl && (
              <div className="mt-3">
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-auto rounded-lg"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Image
                    src={mediaUrl}
                    alt="Post image"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg object-cover"
                    priority={false}
                  />
                )}
              </div>
            )}
            {/* Backward compatibility for old 'image' field */}
            {post.image && mediaUrl && mediaType === "image" && (
              <div className="mt-3">
                <Image
                  src={mediaUrl}
                  alt="Post image"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg object-cover"
                  priority={false}
                />
              </div>
            )}
          </div>

          {/* Post Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            {formatLikesCount(post.likes) && (
              <span>{formatLikesCount(post.likes)}</span>
            )}
            {formatCommentsCount(post.comments) && (
              <span>{formatCommentsCount(post.comments)}</span>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center pt-3 border-t border-gray-100">
            <button
              className={`flex items-center transition-colors ${
                post.likes?.includes(user?.uid)
                  ? "text-blue-500"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => handleLike(post.id)}
            >
              <svg
                className={`w-5 h-5 mr-2 ${
                  post.likes?.includes(user?.uid) ? "fill-current" : "fill-none"
                }`}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              {post.likes?.includes(user?.uid) ? "Liked" : "Like"}
            </button>
          </div>
        </div>

        {/* Add Comment Form */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Add a comment</h3>
            <form onSubmit={handleAddComment}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Comments ({countTotalComments(post.comments) || 0})
          </h3>

          {post.comments && post.comments.length > 0 ? (
            <CommentThread
              comments={post.comments}
              postId={postId}
              user={user}
              isAuthenticated={isAuthenticated}
              onRefresh={refreshPost}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
