import multer from "multer";
import path from "path";
import fs from "fs";

// Define allowed mime types
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "audio/mpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.mimetype.startsWith("image/")) folder = "uploads/images";
    else if (file.mimetype.startsWith("video/")) folder = "uploads/videos";
    else if (file.mimetype.startsWith("audio/")) folder = "uploads/audios";
    else if (file.mimetype.includes("pdf")) folder = "uploads/pdfs";
    else if (
      file.mimetype.includes("msword") ||
      file.mimetype.includes("officedocument")
    )
      folder = "uploads/docs";

    // ✅ Ensure directory exists
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

// File filter to reject unwanted files BEFORE saving
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type") as any, false);
  }
  cb(null, true);
};

export const uploader = multer({ storage, fileFilter });
