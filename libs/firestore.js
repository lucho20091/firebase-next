import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const addPostFirestore = async (postData) => {
  try {
    console.log("postData", postData);
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getPostsFirestore = async (userId) => {
  try {
    const myPosts = query(
      collection(db, "posts"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(myPosts);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    throw error;
  }
};

export const addLikeFirestore = async (postId, userId) => {
  try {
    const docRef = await updateDoc(doc(db, "posts", postId), {
      likes: arrayUnion(userId),
    });
    return docRef;
  } catch (error) {
    console.error("Error adding like:", error);
    throw error;
  }
};

export const removeLikeFirestore = async (postId, userId) => {
  try {
    const docRef = await updateDoc(doc(db, "posts", postId), {
      likes: arrayRemove(userId),
    });
    return docRef;
  } catch (error) {
    console.error("Error removing like:", error);
    throw error;
  }
};

export const getPostByIdFirestore = async (postId) => {
  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Post not found");
    }
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
};

export const addCommentFirestore = async (postId, commentData) => {
  try {
    const docRef = await updateDoc(doc(db, "posts", postId), {
      comments: arrayUnion({
        ...commentData,
        createdAt: new Date(),
        likes: [],
        comments: [],
      }),
    });
    return docRef;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const addReplyFirestore = async (postId, commentIndex, replyData) => {
  try {
    // First, get the current post to access the comments array
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const comments = postData.comments || [];

    if (commentIndex >= comments.length) {
      throw new Error("Comment not found");
    }

    // Add the reply to the specific comment's comments array
    comments[commentIndex].comments = comments[commentIndex].comments || [];
    comments[commentIndex].comments.push({
      ...replyData,
      createdAt: new Date(),
      likes: [],
      comments: [],
    });

    // Update the entire post document with the modified comments array
    await updateDoc(postRef, {
      comments: comments,
    });

    return true;
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
};

export const addNestedReplyFirestore = async (
  postId,
  commentPath,
  replyData
) => {
  try {
    // First, get the current post to access the comments array
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const comments = postData.comments || [];

    // Navigate to the target comment using the path
    let currentLevel = comments;
    for (let i = 0; i < commentPath.length - 1; i++) {
      const index = commentPath[i];
      if (index >= currentLevel.length) {
        throw new Error("Comment path not found");
      }
      currentLevel = currentLevel[index].comments || [];
    }

    const targetIndex = commentPath[commentPath.length - 1];
    if (targetIndex >= currentLevel.length) {
      throw new Error("Target comment not found");
    }

    // Add the reply to the target comment's comments array
    currentLevel[targetIndex].comments =
      currentLevel[targetIndex].comments || [];
    currentLevel[targetIndex].comments.push({
      ...replyData,
      createdAt: new Date(),
      likes: [],
      comments: [],
    });

    // Update the entire post document with the modified comments array
    await updateDoc(postRef, {
      comments: comments,
    });

    return true;
  } catch (error) {
    console.error("Error adding nested reply:", error);
    throw error;
  }
};

export const likeCommentFirestore = async (postId, commentPath, userId) => {
  try {
    // First, get the current post to access the comments array
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const comments = postData.comments || [];

    // Navigate to the target comment using the path
    let currentLevel = comments;
    for (let i = 0; i < commentPath.length - 1; i++) {
      const index = commentPath[i];
      if (index >= currentLevel.length) {
        throw new Error("Comment path not found");
      }
      currentLevel = currentLevel[index].comments || [];
    }

    const targetIndex = commentPath[commentPath.length - 1];
    if (targetIndex >= currentLevel.length) {
      throw new Error("Target comment not found");
    }

    // Add like to the target comment
    currentLevel[targetIndex].likes = currentLevel[targetIndex].likes || [];
    if (!currentLevel[targetIndex].likes.includes(userId)) {
      currentLevel[targetIndex].likes.push(userId);
    }

    // Update the entire post document with the modified comments array
    await updateDoc(postRef, {
      comments: comments,
    });

    return true;
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
};

export const unlikeCommentFirestore = async (postId, commentPath, userId) => {
  try {
    // First, get the current post to access the comments array
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const comments = postData.comments || [];

    // Navigate to the target comment using the path
    let currentLevel = comments;
    for (let i = 0; i < commentPath.length - 1; i++) {
      const index = commentPath[i];
      if (index >= currentLevel.length) {
        throw new Error("Comment path not found");
      }
      currentLevel = currentLevel[index].comments || [];
    }

    const targetIndex = commentPath[commentPath.length - 1];
    if (targetIndex >= currentLevel.length) {
      throw new Error("Target comment not found");
    }

    // Remove like from the target comment
    currentLevel[targetIndex].likes = currentLevel[targetIndex].likes || [];
    currentLevel[targetIndex].likes = currentLevel[targetIndex].likes.filter(
      (id) => id !== userId
    );

    // Update the entire post document with the modified comments array
    await updateDoc(postRef, {
      comments: comments,
    });

    return true;
  } catch (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
};

// export const getTodosFirestore = async (userId) => {
//   try {
//     const q = query(collection(db, "todos"), where("userId", "==", userId));
//     const querySnapshot = await getDocs(q);
//     console.log("querySnapshot", querySnapshot);
//     const todos = querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     // Sort in memory instead of using orderBy to avoid index requirement
//     return todos.sort((a, b) => {
//       const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
//       const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
//       return dateB - dateA; // Descending order
//     });
//   } catch (error) {
//     console.error("Error getting todos:", error);
//     throw error;
//   }
// };
