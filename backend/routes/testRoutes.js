import express from "express";

import {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  getInternshipTest,
} from "../controllers/testController.js";

import { startTest } from "../controllers/testAttemptController.js";

import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// STUDENT - INTERNSHIP TEST
// PUBLIC APPLICATION TOKEN REQUIRED
// No account/login required.
// =====================================================

router.get(
  "/internship/:programId",
  getInternshipTest
);

router.post(
  "/:testId/start",
  startTest
);

// =====================================================
// ADMIN TEST MANAGEMENT
// =====================================================

router.post(
  "/",
  protect,
  admin,
  createTest
);

router.get(
  "/",
  protect,
  admin,
  getAllTests
);

router.get(
  "/:id",
  protect,
  admin,
  getTestById
);

router.put(
  "/:id",
  protect,
  admin,
  updateTest
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteTest
);

export default router;
