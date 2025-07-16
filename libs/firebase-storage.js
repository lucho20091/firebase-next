import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

// Helper function to determine file type
function getFileType(file) {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const videoTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/avi",
    "video/mov",
  ];

  if (imageTypes.includes(file.type)) {
    return "image";
  } else if (videoTypes.includes(file.type)) {
    return "video";
  }
  return "unknown";
}

// Generic upload function for both images and videos
export function uploadMedia(file) {
  const fileType = getFileType(file);

  if (fileType === "unknown") {
    throw new Error("Unsupported file type. Please upload an image or video.");
  }

  const folder = fileType === "image" ? "images" : "videos";
  const storageRef = ref(storage, `${folder}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
    },
    (error) => {
      console.error("Error: ", error);
    }
  );

  return uploadTask;
}

// Legacy function for backward compatibility
export function uploadImage(file) {
  return uploadMedia(file);
}

// Generic function to get media URL (image or video)
export async function getMediaURL(filePath, fileType = "image") {
  try {
    const folder = fileType === "video" ? "videos" : "images";
    const mediaRef = ref(storage, `${folder}/${filePath}`);
    const url = await getDownloadURL(mediaRef);
    return url;
  } catch (error) {
    console.error("Error getting media URL:", error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function getImageURL(imagePath) {
  return getMediaURL(imagePath, "image");
}

// New function specifically for videos
export async function getVideoURL(videoPath) {
  return getMediaURL(videoPath, "video");
}
