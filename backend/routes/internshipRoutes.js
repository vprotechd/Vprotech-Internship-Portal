import express from "express";

import {
  getInternshipPrograms,
  getInternshipProgramById,
  createInternshipProgram,
  updateInternshipProgram,
  deleteInternshipProgram,
  applyForInternship,
  getPublicApplicationStatus,
  getAllInternshipApplications,
  updateInternshipApplicationStatus,
} from "../controllers/internshipController.js";

import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// STUDENT - APPLY FOR INTERNSHIP
// =====================================================

router.post(
  "/programs/:id/apply",
  applyForInternship
);

// =====================================================
// PUBLIC APPLICATION STATUS
// =====================================================

router.get(
  "/application-status",
  getPublicApplicationStatus
);

// =====================================================
// PUBLIC ROUTES
// =====================================================

router.get(
  "/programs",
  getInternshipPrograms
);

router.get(
  "/programs/:id",
  getInternshipProgramById
);

// =====================================================
// STUDENT - MY INTERNSHIP APPLICATIONS
// =====================================================

router.get(
  "/my-applications",
  protect,
  async (req, res) => {
    try {
      const InternshipApplication =
        (await import("../models/InternshipApplication.js"))
          .default;

      const applications =
        await InternshipApplication.find({
          applicant: req.user._id,
        })
          .populate(
            "program",
            "title domain duration description eligibility status"
          )
          .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "❌ Get my internship applications error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch your internship applications",
      });
    }
  }
);

// =====================================================
// ADMIN - INTERNSHIP PROGRAMS
// =====================================================

router.post(
  "/programs",
  protect,
  admin,
  createInternshipProgram
);

router.put(
  "/programs/:id",
  protect,
  admin,
  updateInternshipProgram
);

router.delete(
  "/programs/:id",
  protect,
  admin,
  deleteInternshipProgram
);

// =====================================================
// ADMIN - INTERNSHIP APPLICATIONS
// =====================================================

router.get(
  "/applications",
  protect,
  admin,
  getAllInternshipApplications
);

router.put(
  "/applications/:id/status",
  protect,
  admin,
  updateInternshipApplicationStatus
);

export default router;