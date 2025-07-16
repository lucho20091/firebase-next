"use client";
import { useState } from "react";
import Image from "next/image";
import {
  addNestedReplyFirestore,
  likeCommentFirestore,
  unlikeCommentFirestore,
} from "@/libs/firestore";

export default function CommentThread({
  comments,
  postId,
  user,
  isAuthenticated,
  onRefresh,
  depth = 0,
  commentPath = [],
}) {
  const MAX_DEPTH = 10; // Maximum nesting level
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleAddReply = async (e, commentIndex) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const replyData = {
        comment: replyText.trim(),
        userId: user.uid,
        userImage: user.photoURL || "/avatar.jpg",
        userName: user.displayName || user.email,
      };

      // If we're at the top level, use the main addReplyFirestore
      if (depth === 0) {
        const { addReplyFirestore } = await import("@/libs/firestore");
        await addReplyFirestore(postId, commentIndex, replyData);
      } else {
        // For nested replies, build the full path to the target comment
        const fullPath = [...commentPath, commentIndex];
        await addNestedReplyFirestore(postId, fullPath, replyData);
      }

      setReplyText("");
      setReplyingTo(null);
      onRefresh();
    } catch (error) {
      console.error("Error adding reply:", error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const startReply = (commentIndex) => {
    setReplyingTo(commentIndex);
    setReplyText("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleLikeComment = async (commentIndex) => {
    try {
      const fullPath = [...commentPath, commentIndex];
      const hasLiked = comments[commentIndex]?.likes?.includes(user.uid);

      if (hasLiked) {
        await unlikeCommentFirestore(postId, fullPath, user.uid);
      } else {
        await likeCommentFirestore(postId, fullPath, user.uid);
      }

      onRefresh();
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const formatCommentLikesCount = (likes) => {
    if (!likes || likes.length === 0) {
      return null;
    }
    if (likes.length === 1) {
      return "1 like";
    }
    return `${likes.length} likes`;
  };

  const getAvatarSize = () => {
    if (depth === 0) return 32;
    if (depth === 1) return 24;
    if (depth === 2) return 20;
    return Math.max(16, 24 - depth * 2); // Gradually decrease size
  };

  const getTextSize = () => {
    if (depth === 0) return "text-sm";
    if (depth === 1) return "text-sm";
    if (depth === 2) return "text-xs";
    return "text-xs";
  };

  const getIndentClass = () => {
    if (depth === 0) return "";
    if (depth === 1) return "ml-8";
    if (depth === 2) return "ml-12";
    return `ml-${Math.min(16, 8 + depth * 2)}`;
  };

  const getBorderClass = () => {
    if (depth === 0) return "";
    if (depth === 1) return "border-l-2 border-gray-200 pl-3";
    if (depth === 2) return "border-l-2 border-gray-300 pl-2";
    return "border-l-2 border-gray-400 pl-2";
  };

  const getButtonSize = () => {
    if (depth <= 2) return "text-xs";
    return "text-xs";
  };

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-${depth === 0 ? "4" : "3"}`}>
      {comments.map((comment, index) => (
        <div
          key={index}
          className={`${
            depth > 0 ? getBorderClass() : ""
          } pb-4 last:border-b-0`}
        >
          <div className="flex items-start">
            <div className={`relative mr-${depth === 0 ? "3" : "2"}`}>
              <Image
                src={comment.userImage || "/avatar.jpg"}
                alt="User Avatar"
                width={getAvatarSize()}
                height={getAvatarSize()}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span
                  className={`font-medium text-gray-900 mr-2 ${getTextSize()}`}
                >
                  {comment.userName || "Anonymous"}
                </span>
                <span className="text-xs text-gray-500">
                  {comment.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "Just now"}
                </span>
              </div>
              <p className={`text-gray-800 ${getTextSize()} mb-2`}>
                {comment.comment}
              </p>

              {/* Comment actions */}
              <div className="flex items-center gap-3 mb-2">
                {/* Like button */}
                {isAuthenticated && (
                  <button
                    onClick={() => handleLikeComment(index)}
                    className={`flex items-center transition-colors ${
                      comment.likes?.includes(user.uid)
                        ? "text-blue-500"
                        : "text-gray-500 hover:text-blue-500"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 mr-1 ${
                        comment.likes?.includes(user.uid)
                          ? "fill-current"
                          : "fill-none"
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
                    {comment.likes?.includes(user.uid) ? "Liked" : "Like"}
                  </button>
                )}

                {/* Reply button */}
                {isAuthenticated && depth < MAX_DEPTH - 1 && (
                  <button
                    onClick={() => startReply(index)}
                    className={`${getButtonSize()} text-blue-500 hover:text-blue-700`}
                  >
                    Reply
                  </button>
                )}
                {isAuthenticated && depth >= MAX_DEPTH - 1 && (
                  <span
                    className={`${getButtonSize()} text-gray-400 cursor-not-allowed`}
                    title="Maximum nesting level reached (10 levels)"
                  >
                    Max depth reached
                  </span>
                )}
              </div>

              {/* Comment likes count */}
              {formatCommentLikesCount(comment.likes) && (
                <div className="text-xs text-gray-500 mb-2">
                  {formatCommentLikesCount(comment.likes)}
                </div>
              )}

              {/* Reply form */}
              {replyingTo === index && (
                <div className={`mt-2 ${getIndentClass()}`}>
                  <form onSubmit={(e) => handleAddReply(e, index)}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className={`w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getTextSize()}`}
                      rows="2"
                      disabled={submittingReply}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={!replyText.trim() || submittingReply}
                        className={`px-2 py-1 bg-blue-500 text-white rounded ${getButtonSize()} hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {submittingReply ? "Posting..." : "Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelReply}
                        className={`px-2 py-1 bg-gray-300 text-gray-700 rounded ${getButtonSize()} hover:bg-gray-400`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Recursive nested comments */}
              {comment.comments && comment.comments.length > 0 && (
                <div className={`mt-3 ${getIndentClass()}`}>
                  <CommentThread
                    comments={comment.comments}
                    postId={postId}
                    user={user}
                    isAuthenticated={isAuthenticated}
                    onRefresh={onRefresh}
                    depth={depth + 1}
                    commentPath={[...commentPath, index]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
