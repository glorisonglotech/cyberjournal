import { Router } from "express";
import {
  createArticle,
  deleteArticle,
  getArticleBySlug,
  getFeatured,
  getPublicStats,
  listArticles,
  searchArticles,
  updateArticle,
} from "../controllers/article.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/security.js";

const router = Router();

router.get("/", listArticles);
router.get("/featured", getFeatured);
router.get("/search", searchArticles);
router.get("/stats", getPublicStats);

router.post("/", protect, restrictTo("admin"), writeLimiter, createArticle);
router.put("/:id", protect, restrictTo("admin"), writeLimiter, updateArticle);
router.delete("/:id", protect, restrictTo("admin"), writeLimiter, deleteArticle);

router.get("/:slug", getArticleBySlug);

export default router;
