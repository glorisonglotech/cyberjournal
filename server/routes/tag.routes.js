import { Router } from "express";
import { createTag, deleteTag, listTags } from "../controllers/tag.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.get("/", listTags);
router.post("/", protect, restrictTo("admin"), createTag);
router.delete("/:id", protect, restrictTo("admin"), deleteTag);

export default router;
