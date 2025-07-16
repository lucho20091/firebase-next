"use client";
export const dynamic = "force-dynamic";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPostsFirestore,
  addLikeFirestore,
  removeLikeFirestore,
} from "@/libs/firestore";
import { getMediaURL } from "@/libs/firebase-storage";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});

  const formatLikesCount = (likes) => {
    if (!likes || likes.length === 0) {
      return null; // Return null to hide the likes display
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

  const handleLike = async (postId) => {
    try {
      // Find the current post to check if user has already liked it
      const currentPost = todos.find((post) => post.id === postId);
      const hasLiked = currentPost?.likes?.includes(user.uid);

      if (hasLiked) {
        // User has already liked, so unlike
        await removeLikeFirestore(postId, user.uid);
      } else {
        // User hasn't liked, so like
        await addLikeFirestore(postId, user.uid);
      }

      // Refresh posts to show updated likes
      const updatedPosts = await getPostsFirestore(user.uid);
      setTodos(updatedPosts);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const loadMediaUrls = async (posts) => {
    const urls = {};
    for (const post of posts) {
      if (post.media) {
        try {
          const url = await getMediaURL(post.media, post.mediaType || "image");
          if (url) {
            urls[post.id] = { url, type: post.mediaType || "image" };
          }
        } catch (error) {
          console.error("Error loading media for post:", post.id, error);
        }
      }
      // Backward compatibility for old 'image' field
      else if (post.image) {
        try {
          const url = await getMediaURL(post.image, "image");
          if (url) {
            urls[post.id] = { url, type: "image" };
          }
        } catch (error) {
          console.error("Error loading image for post:", post.id, error);
        }
      }
    }
    setMediaUrls(urls);
  };

  useEffect(() => {
    async function fetchTodos() {
      try {
        if (user?.uid) {
          console.log("user.uid", user.uid);
          setTodosLoading(true);
          console.log("Fetching todos for user:", user.uid);
          const todos = await getPostsFirestore(user.uid);
          console.log("todos", todos);
          setTodos(todos);

          // Load image URLs for posts with images
          await loadMediaUrls(todos);

          console.log("todos", todos);
        }
      } catch (error) {
        console.error("Error fetching todos:", error);
      } finally {
        setTodosLoading(false);
      }
    }

    if (isAuthenticated && user?.uid) {
      fetchTodos();
    }
  }, [isAuthenticated, user?.uid]);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Posts
        </h1>
        {todosLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {todos && todos.length > 0 ? (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  {/* Post Header */}
                  <div className="flex items-center mb-3">
                    <div className="relative">
                      <Image
                        src={todo.userImage || "/avatar.jpg"}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {todo.userName || "Anonymous"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {todo.createdAt
                          ?.toDate?.()
                          ?.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) || "Just now"}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed mb-3">
                      {todo.post}
                    </p>

                    {/* Post Media */}
                    {todo.media && mediaUrls[todo.id] && (
                      <div className="mt-3">
                        {mediaUrls[todo.id].type === "video" ? (
                          <video
                            src={mediaUrls[todo.id].url}
                            controls
                            className="w-full h-auto rounded-lg"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <Image
                            src={mediaUrls[todo.id].url}
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
                    {todo.image && mediaUrls[todo.id] && (
                      <div className="mt-3">
                        <Image
                          src={mediaUrls[todo.id].url}
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
                  {(formatLikesCount(todo.likes) ||
                    formatCommentsCount(todo.comments)) && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                      {formatLikesCount(todo.likes) && (
                        <span>{formatLikesCount(todo.likes)}</span>
                      )}
                      {formatCommentsCount(todo.comments) && (
                        <span>{formatCommentsCount(todo.comments)}</span>
                      )}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-3">
                    <button
                      className={`flex items-center transition-colors ${
                        todo.likes?.includes(user.uid)
                          ? "text-blue-500"
                          : "text-gray-500 hover:text-blue-500"
                      }`}
                      onClick={() => handleLike(todo.id)}
                    >
                      <svg
                        className={`w-5 h-5 mr-2 ${
                          todo.likes?.includes(user.uid)
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
                      {todo.likes?.includes(user.uid) ? "Liked" : "Like"}
                    </button>
                    <button
                      className="flex items-center text-gray-500 hover:text-blue-500 transition-colors"
                      onClick={() => router.push(`/post/${todo.id}`)}
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Comment
                    </button>
                    <button
                      className="flex items-center text-gray-500 hover:text-blue-500 transition-colors"
                      onClick={() => {
                        const postUrl = `${window.location.origin}/post/${todo.id}`;
                        navigator.clipboard
                          .writeText(postUrl)
                          .then(() => {
                            // Optional: Show a toast or alert that URL was copied
                            alert("Post URL copied to clipboard!");
                          })
                          .catch((err) => {
                            console.error("Failed to copy URL:", err);
                            alert("Failed to copy URL");
                          });
                      }}
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
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500">
                  When you create posts, they'll appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
