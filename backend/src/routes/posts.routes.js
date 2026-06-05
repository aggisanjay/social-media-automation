import express from "express";
import multer from "multer";
import os from "os";
import {
  createPost,
  getUpcomingPosts,
  getPublishedPosts,
  updatePost,
  deletePost,
  publishImmediately
} from "../controllers/posts.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const upload = multer({ dest: os.tmpdir() });
const router = express.Router();

router.use(protect); // All post routes are protected

router.post("/", upload.single("media"), createPost);
router.get("/upcoming", getUpcomingPosts);
router.get("/published", getPublishedPosts);
router.put("/:id", upload.single("media"), updatePost);
router.delete("/:id", deletePost);
router.post("/:id/publish", publishImmediately);

export default router;
