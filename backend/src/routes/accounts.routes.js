import express from "express";
import { getAccounts, connectAccount, disconnectAccount, syncAccount } from "../controllers/accounts.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All social account routes are protected

router.get("/", getAccounts);
router.post("/connect", connectAccount);
router.post("/:id/sync", syncAccount);
router.delete("/:id", disconnectAccount);

export default router;
