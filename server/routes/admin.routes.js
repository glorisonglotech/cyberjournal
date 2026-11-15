import { Router } from "express";
import {
  dashboard,
  getArticleForEdit,
  listAllArticles,
  stats,
} from "../controllers/admin.controller.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/dashboard", dashboard);
router.get("/articles", listAllArticles);
router.get("/articles/:id", getArticleForEdit);
router.get("/stats", stats);

export default router;
