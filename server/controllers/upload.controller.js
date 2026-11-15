import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "../middleware/upload.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function matchesSignature(header, ext) {
  if (ext === ".jpg") return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (ext === ".png") return header.subarray(0, 8).equals(PNG);
  if (ext === ".webp") {
    return (
      header.subarray(0, 4).toString("ascii") === "RIFF" &&
      header.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function uploadOne(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: "No image was uploaded." });
  }

  const ext = path.extname(req.file.filename).toLowerCase();
  const filePath = path.join(UPLOAD_DIR, req.file.filename);

  try {
    const handle = await fs.open(filePath, "r");
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    await handle.close();

    if (!matchesSignature(header, ext)) {
      await fs.unlink(filePath).catch(() => undefined);
      return res.status(400).json({
        message: "That file is not a valid JPEG, PNG or WebP image.",
      });
    }
  } catch (error) {
    await fs.unlink(filePath).catch(() => undefined);
    return next(error);
  }

  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
}
