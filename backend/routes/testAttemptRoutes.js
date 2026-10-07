import express from "express";

import {
  startTest,
  submitTest,
  getMyAttempt,
  getMyAttempts,
  getAllAttempts,
  getAdminAttempt,
} from "../controllers/testAttemptController.js";

import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// PUBLIC STUDENT TEST ROUTES
// Application token is validated by the controller.
// =====================================================

router.post(
  "/start/:testId",
  startTest
);

router.post(
  "/:attemptId/submit",
  submitTest
);

// =====================================================
// EXISTING REGISTERED-USER ROUTES
// =====================================================

router.get(
  "/my/:attemptId",
  protect,
  getMyAttempt
);

router.get(
  "/my",
  protect,
  getMyAttempts
);

// =====================================================
// ADMIN
// =====================================================

router.get(
  "/all",
  protect,
  admin,
  getAllAttempts
);

router.get(
  "/admin/:attemptId",
  protect,
  admin,
  getAdminAttempt
);

export default router;
