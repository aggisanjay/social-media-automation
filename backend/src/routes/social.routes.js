import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  connectPlatform,
  oauthCallback,
  getAccounts,
  disconnectAccount,
  syncAccounts
} from "../controllers/social.controller.js";

const router = express.Router();

router.post("/connect/:platform", protect, connectPlatform);
router.get("/callback", oauthCallback);
router.get("/accounts", protect, getAccounts);
router.delete("/accounts/:id", protect, disconnectAccount);
router.post("/sync", protect, syncAccounts);

export default router;
