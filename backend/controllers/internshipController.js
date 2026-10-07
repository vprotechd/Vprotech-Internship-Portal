
import InternshipProgram from "../models/InternshipProgram.js";
import InternshipApplication from "../models/InternshipApplication.js";
import crypto from "crypto";

// =====================================================
// APPLY FOR INTERNSHIP
// POST /api/internship/programs/:id/apply
// Public
// =====================================================
export const applyForInternship = async (req, res) => {
  try {
    console.log("====================================");
    console.log("📩 Public Internship Application Received");
    console.log("BODY:", req.body);
    console.log("====================================");

    const { id } = req.params;
    const { name, email, phone, education } = req.body || {};

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !education?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and education are required",
      });
    }

    const program = await InternshipProgram.findById(id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Internship program not found",
      });
    }

    if (program.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This internship program is not currently active",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicate applications for the same program/email.
    // If an old application has no token, create one now so it can
    // use the new passwordless student flow.
    let application = await InternshipApplication.findOne({
      program: program._id,
      email: normalizedEmail,
    });

    if (application) {
      if (!application.accessToken) {
        application.accessToken = crypto.randomBytes(32).toString("hex");
        await application.save();
      }

      return res.status(200).json({
        success: true,
        message:
          application.status === "approved"
            ? "You have already applied and your application is approved."
            : "You have already applied for this internship. Please wait for admin approval.",
        application: {
          _id: application._id,
          program: application.program,
          name: application.name,
          email: application.email,
          phone: application.phone,
          education: application.education,
          status: application.status,
        },
        accessToken: application.accessToken,
      });
    }

    const accessToken = crypto.randomBytes(32).toString("hex");

    application = await InternshipApplication.create({
      program: program._id,
      applicant: req.user?._id || null,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      education: education.trim(),
      accessToken,
      status: "pending",
    });

    console.log(
      "✅ Public internship application created:",
      application._id
    );

    return res.status(201).json({
      success: true,
      message:
        "Internship application submitted successfully. Please wait for admin approval.",
      application: {
        _id: application._id,
        program: application.program,
        name: application.name,
        email: application.email,
        phone: application.phone,
        education: application.education,
        status: application.status,
      },
      accessToken,
    });
  } catch (error) {
    console.error("❌ Apply internship error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit internship application",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// PUBLIC - GET APPLICATION STATUS
// GET /api/internship/application-status
// No account/login required.
// The access token is issued when the student applies.
// =====================================================
export const getPublicApplicationStatus = async (req, res) => {
  try {
    const accessToken =
      req.headers["x-internship-token"] ||
      req.query.accessToken;

    const programId =
      req.query.programId;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Application access token is required.",
      });
    }

    const query = {
      accessToken,
    };

    if (programId) {
      query.program = programId;
    }

    const application =
      await InternshipApplication.findOne(query)
        .populate(
          "program",
          "title domain duration description eligibility status"
        )
        .select(
          "_id program name email phone education status createdAt updatedAt"
        );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Internship application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error(
      "❌ Public application status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch application status.",
    });
  }
};

// =====================================================
// GET ALL ACTIVE/PUBLISHED INTERNSHIP PROGRAMS
// GET /api/internship/programs
// Public
// =====================================================
export const getInternshipPrograms = async (req, res) => {
  try {
    const programs = await InternshipProgram.find({
      status: { $in: ["active", "draft"] },
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: programs.length,
      programs,
    });
  } catch (error) {
    console.error(
      "Get internship programs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch internship programs",
    });
  }
};

// =====================================================
// GET SINGLE INTERNSHIP PROGRAM
// GET /api/internship/programs/:id
// Public
// =====================================================
export const getInternshipProgramById = async (
  req,
  res
) => {
  try {
    const program =
      await InternshipProgram.findById(
        req.params.id
      ).populate("createdBy", "name email");

    if (!program) {
      return res.status(404).json({
        success: false,
        message:
          "Internship program not found",
      });
    }

    return res.status(200).json({
      success: true,
      program,
    });
  } catch (error) {
    console.error(
      "Get internship program error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch internship program",
    });
  }
};

// =====================================================
// CREATE INTERNSHIP PROGRAM
// POST /api/internship/programs
// Admin only
// =====================================================
export const createInternshipProgram = async (
  req,
  res
) => {
  try {
    const {
      title,
      domain,
      duration,
      description,
      eligibility,
      status,
    } = req.body;

    if (
      !title ||
      !domain ||
      !duration ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, domain, duration and description are required",
      });
    }

    const program =
      await InternshipProgram.create({
        title: title.trim(),
        domain: domain.trim(),
        duration: duration.trim(),
        description: description.trim(),
        eligibility:
          eligibility?.trim() || "",
        status: status || "draft",
        createdBy: req.user?._id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Internship program created successfully",
      program,
    });
  } catch (error) {
    console.error(
      "Create internship program error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create internship program",
    });
  }
};

// =====================================================
// UPDATE INTERNSHIP PROGRAM
// PUT /api/internship/programs/:id
// Admin only
// =====================================================
export const updateInternshipProgram = async (
  req,
  res
) => {
  try {
    const {
      title,
      domain,
      duration,
      description,
      eligibility,
      status,
    } = req.body;

    const program =
      await InternshipProgram.findById(
        req.params.id
      );

    if (!program) {
      return res.status(404).json({
        success: false,
        message:
          "Internship program not found",
      });
    }

    if (title !== undefined) {
      program.title = title.trim();
    }

    if (domain !== undefined) {
      program.domain = domain.trim();
    }

    if (duration !== undefined) {
      program.duration = duration.trim();
    }

    if (description !== undefined) {
      program.description =
        description.trim();
    }

    if (eligibility !== undefined) {
      program.eligibility =
        eligibility.trim();
    }

    if (status !== undefined) {
      program.status = status;
    }

    const updatedProgram =
      await program.save();

    return res.status(200).json({
      success: true,
      message:
        "Internship program updated successfully",
      program: updatedProgram,
    });
  } catch (error) {
    console.error(
      "Update internship program error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update internship program",
    });
  }
};

// =====================================================
// DELETE INTERNSHIP PROGRAM
// DELETE /api/internship/programs/:id
// Admin only
// =====================================================
export const deleteInternshipProgram = async (
  req,
  res
) => {
  try {
    const program =
      await InternshipProgram.findById(
        req.params.id
      );

    if (!program) {
      return res.status(404).json({
        success: false,
        message:
          "Internship program not found",
      });
    }

    await InternshipProgram.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Internship program deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete internship program error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete internship program",
    });
  }
};

// =====================================================
// ADMIN - GET ALL INTERNSHIP APPLICATIONS
// GET /api/internship/applications
// Admin only
// =====================================================
export const getAllInternshipApplications = async (
  req,
  res
) => {
  try {
    const applications =
      await InternshipApplication.find()
        .populate(
          "program",
          "title domain duration"
        )
        .populate(
          "applicant",
          "name email"
        )
        .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error(
      "❌ Get internship applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch internship applications",
    });
  }
};

// =====================================================
// ADMIN - UPDATE APPLICATION STATUS
// PUT /api/internship/applications/:id/status
// Admin only
// =====================================================
export const updateInternshipApplicationStatus =
  async (req, res) => {
    try {
      const { id } = req.params;
      const receivedStatus = req.body?.status;
      const normalizedStatus =
        typeof receivedStatus === "string"
          ? receivedStatus.trim().toLowerCase()
          : receivedStatus;
      const status =
        normalizedStatus === "shortlisted"
          ? "approved"
          : normalizedStatus;

      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        console.warn("Invalid internship application status:", {
          applicationId: id,
          receivedStatus,
          allowedStatuses,
        });

        return res.status(400).json({
          success: false,
          message: `Invalid application status. Received "${String(
            receivedStatus
          )}"; expected one of: ${allowedStatuses.join(", ")}.`,
          receivedStatus: receivedStatus ?? null,
          allowedStatuses,
        });
      }

      const application =
        await InternshipApplication.findById(
          id
        );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Internship application not found",
        });
      }

      application.status = status;

      await application.save();

      const updatedApplication =
        await InternshipApplication.findById(
          id
        )
          .populate(
            "program",
            "title domain duration"
          )
          .populate(
            "applicant",
            "name email"
          );

      return res.status(200).json({
        success: true,
        message:
          "Application status updated successfully",
        application: updatedApplication,
      });
    } catch (error) {
      console.error(
        "❌ Update internship application status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update application status",
      });
    }
  };
