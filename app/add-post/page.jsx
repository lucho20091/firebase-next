"use client";
import { addPostFirestore } from "@/libs/firestore";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadMedia } from "@/libs/firebase-storage";

export default function AddPost() {
  const { user, isAuthenticated, loading } = useAuth();
  const [postForm, setPostForm] = useState({
    post: "",
    userId: null,
    userImage: null,
    userName: null,
    comments: [],
    likes: [],
  });

  useEffect(() => {
    if (user) {
      setPostForm({
        ...postForm,
        userId: user.uid,
        userImage: user.photoURL || "./avatar.jpg",
        userName: user.displayName,
      });
    }
  }, [user]);

  const handleAddPost = async () => {
    try {
      const response = await addPostFirestore(postForm);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Determine if it's an image or video
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        alert("Please select an image or video file.");
        return;
      }

      setPostForm({
        ...postForm,
        media: file.name,
        mediaType: isVideo ? "video" : "image",
      });
      uploadMedia(file);
    }
  };

  return (
    <div className="p-4 text-center">
      <form action={handleAddPost} className="flex flex-col gap-4">
        <textarea
          placeholder="What's on your mind?"
          className="p-2 h-24 border-1 border-gray-200 rounded-md"
          name="post"
          value={postForm.post}
          onChange={(e) => setPostForm({ ...postForm, post: e.target.value })}
        />
        <div>
          <input
            type="file"
            name="media"
            onChange={handleMediaChange}
            accept="image/*,video/*"
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, OGG,
            AVI, MOV)
          </p>
        </div>
        <button type="submit" className="bg-black text-white p-2 rounded-md">
          Add Post
        </button>
      </form>
    </div>
  );
}
