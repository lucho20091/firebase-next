"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getPostsFirestore } from "@/libs/firestore";
import { getMediaURL, uploadProfilePicture } from "@/libs/firebase-storage";
import { updateUserDisplayName, updateUserPhotoURL } from "@/libs/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

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

    let total = comments.length;
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

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditedName(user.displayName || user.email || "");
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      alert("Name cannot be empty");
      return;
    }

    try {
      setUpdatingName(true);
      await updateUserDisplayName(editedName.trim());
      setIsEditingName(false);
      alert("Name updated successfully!");
      // The AuthContext will automatically update with the new display name
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name. Please try again.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const imageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!imageTypes.includes(file.type)) {
        alert("Please select an image file (JPEG, PNG, GIF, WebP)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      alert("Please select a photo first");
      return;
    }

    try {
      setUploadingPhoto(true);

      // Upload the photo to Firebase Storage
      const uploadTask = uploadProfilePicture(selectedPhoto);

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress updates
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              // Get the download URL
              const downloadURL = await uploadTask;
              const photoURL = await downloadURL.ref.getDownloadURL();

              // Update the user's photo URL in Firebase Auth
              await updateUserPhotoURL(photoURL);

              // Clear the form
              setSelectedPhoto(null);
              setPhotoPreview(null);

              alert("Profile picture updated successfully!");
              // The AuthContext will automatically update with the new photo URL
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoCancel = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  useEffect(() => {
    async function fetchUserPosts() {
      try {
        if (user?.uid) {
          setPostsLoading(true);
          const posts = await getPostsFirestore(user.uid);
          setUserPosts(posts);
          await loadMediaUrls(posts);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setPostsLoading(false);
      }
    }

    if (isAuthenticated && user?.uid) {
      fetchUserPosts();
    }
  }, [isAuthenticated, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image
                src={user.photoURL || "/avatar.jpg"}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              {/* Photo upload overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                    disabled={updatingName}
                  >
                    {updatingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {user.displayName || user.email || "Anonymous"}
                  </h1>
                  <button
                    onClick={handleNameEdit}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400">
                {userPosts.length} post{userPosts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Photo upload section */}
          {selectedPhoto && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Preview:
              </h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{selectedPhoto.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPhoto ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={handlePhotoCancel}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Posts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Posts</h2>

          {postsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-4">
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
                  <p className="text-gray-800 leading-relaxed mb-3">
                    {post.post}
                  </p>

                  {/* Post Media */}
                  {post.media && mediaUrls[post.id] && (
                    <div className="mt-3">
                      {mediaUrls[post.id].type === "video" ? (
                        <video
                          src={mediaUrls[post.id].url}
                          controls
                          className="w-full h-auto rounded-lg"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <Image
                          src={mediaUrls[post.id].url}
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
                  {post.image && mediaUrls[post.id] && (
                    <div className="mt-3">
                      <Image
                        src={mediaUrls[post.id].url}
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
                {(formatLikesCount(post.likes) ||
                  formatCommentsCount(post.comments)) && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    {formatLikesCount(post.likes) && (
                      <span>{formatLikesCount(post.likes)}</span>
                    )}
                    {formatCommentsCount(post.comments) && (
                      <span>{formatCommentsCount(post.comments)}</span>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3">
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-500 transition-colors"
                    onClick={() => router.push(`/post/${post.id}`)}
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
                    View Comments
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-500 transition-colors"
                    onClick={() => {
                      const postUrl = `${window.location.origin}/post/${post.id}`;
                      navigator.clipboard
                        .writeText(postUrl)
                        .then(() => {
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
              <p className="text-gray-500 mb-4">
                You haven't created any posts yet.
              </p>
              <button
                onClick={() => router.push("/add-post")}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
