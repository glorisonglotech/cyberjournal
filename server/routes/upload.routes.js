import { Router } from "express";
import { uploadOne } from "../controllers/upload.controller.js";
import { uploadImage } from "../middleware/upload.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/security.js";

const router = Router();

router.post(
  "/",
  protect,
  restrictTo("admin"),
  uploadLimiter,
  uploadImage.single("image"),
  uploadOne,
);

export default router;
