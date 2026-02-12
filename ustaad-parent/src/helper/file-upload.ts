import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(
  file: Express.Multer.File,
  folder: string,
  prefix: string
): Promise<string> {
  const uploadsFolder = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, { recursive: true });
  }

  const fullFolderPath = path.join(uploadsFolder, folder);
  if (!fs.existsSync(fullFolderPath)) {
    fs.mkdirSync(fullFolderPath, { recursive: true });
  }

  // Determine extension from mimetype
  let fileExtension = path.extname(file.originalname);
  if (file.mimetype === "image/png") fileExtension = ".png";
  else if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg")
    fileExtension = ".jpg";
  else if (file.mimetype === "application/pdf") fileExtension = ".pdf";

  console.log(
    "Original name:",
    file.originalname,
    "MimeType:",
    file.mimetype,
    "Extracted extension:",
    fileExtension
  );
  const fileName = `${prefix}-${uuidv4()}${fileExtension}`;
  const filePath = path.join(fullFolderPath, fileName);

  try {
    await fs.promises.writeFile(filePath, file.buffer); // ✅ Use buffer directly
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    throw new Error(`Failed to write file: ${error}`);
  }
}
