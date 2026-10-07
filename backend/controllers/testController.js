import Test from "../models/Test.js";
import InternshipProgram from "../models/InternshipProgram.js";
import InternshipApplication from "../models/InternshipApplication.js";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";

// =====================================================
// CREATE TEST
// POST /api/tests
// ADMIN ONLY
// =====================================================
export const createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      program,
      duration,
      totalMarks,
      passingMarks,
      instructions,
      startDate,
      endDate,
      status,
      assignedStudents,
      questions,
    } = req.body;

    const numericDuration = Number(duration);
    const numericTotalMarks = Number(totalMarks);
    const numericPassingMarks = Number(passingMarks);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !program ||
      !Number.isFinite(numericDuration) ||
      numericDuration < 1 ||
      !Number.isFinite(numericTotalMarks) ||
      numericTotalMarks < 1 ||
      !Number.isFinite(numericPassingMarks) ||
      numericPassingMarks < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, program, duration, total marks and passing marks are required",
      });
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: "Questions must be an array",
        });
      }

      const invalidQuestion = questions.find((question) => {
        if (!question || typeof question !== "object") {
          return true;
        }

        const options = Array.isArray(question.options)
          ? question.options.map((option) =>
              typeof option === "string" ? option.trim() : ""
            )
          : [];
        const correctAnswer =
          typeof question.correctAnswer === "string"
            ? question.correctAnswer.trim()
            : "";

        return (
          typeof question.questionText !== "string" ||
          !question.questionText.trim() ||
          options.length < 2 ||
          options.some((option) => !option) ||
          !correctAnswer ||
          !options.includes(correctAnswer) ||
          !Number.isFinite(Number(question.marks)) ||
          Number(question.marks) < 1
        );
      });

      if (invalidQuestion) {
        return res.status(400).json({
          success: false,
          message: "Each question must have text, valid options, a correct answer and positive marks",
        });
      }

      const questionTotalMarks = questions.reduce(
        (total, question) => total + Number(question.marks),
        0
      );

      if (
        questions.length > 0 &&
        questionTotalMarks !== numericTotalMarks
      ) {
        return res.status(400).json({
          success: false,
          message: "Total marks must equal the sum of question marks",
        });
      }
    }

    // Check whether internship program exists
    const internshipProgram = await InternshipProgram.findById(program);

    if (!internshipProgram) {
      return res.status(404).json({
        success: false,
        message: "Internship program not found",
      });
    }

    // Passing marks cannot be greater than total marks
    if (numericPassingMarks > numericTotalMarks) {
      return res.status(400).json({
        success: false,
        message: "Passing marks cannot be greater than total marks",
      });
    }

    const test = await Test.create({
      title: title.trim(),
      description: description?.trim() || "",
      program,
      duration: numericDuration,
      totalMarks: numericTotalMarks,
      passingMarks: numericPassingMarks,
      instructions: Array.isArray(instructions) ? instructions : [],
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "draft",
      assignedStudents: Array.isArray(assignedStudents)
        ? assignedStudents
        : [],
      createdBy: req.user?._id,
    });

    if (questions?.length) {
      await Question.insertMany(
        questions.map((question, index) => ({
          test: test._id,
          questionText: question.questionText.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer.trim(),
          marks: Number(question.marks),
          order: Number(question.order) || index + 1,
        }))
      );
    }

    const populatedTest = await Test.findById(test._id)
      .populate("program", "title domain duration")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      test: populatedTest,
    });
  } catch (error) {
    console.error("Create test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create test",
    });
  }
};


// =====================================================
// GET ALL TESTS
// GET /api/tests
// ADMIN ONLY
// =====================================================
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate("program", "title domain duration")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error) {
    console.error("Get all tests error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tests",
    });
  }
};


// =====================================================
// GET SINGLE TEST
// GET /api/tests/:id
// ADMIN ONLY
// =====================================================
// =====================================================
// GET SINGLE TEST
// GET /api/tests/:id
// ADMIN ONLY
// =====================================================
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("program", "title domain duration")
      .populate("createdBy", "name email");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const questions = await Question.find({
      test: test._id,
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      test,
      questions,
    });
  } catch (error) {
    console.error("Get test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch test",
    });
  }
};

// =====================================================
// UPDATE TEST
// PUT /api/tests/:id
// ADMIN ONLY
// =====================================================
// =====================================================
// UPDATE TEST
// PUT /api/tests/:id
// ADMIN ONLY
// =====================================================
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const {
      title,
      description,
      program,
      duration,
      totalMarks,
      passingMarks,
      instructions,
      startDate,
      endDate,
      status,
      assignedStudents,
      questions,
    } = req.body;

    // =================================================
    // VALIDATE PROGRAM
    // =================================================

    if (program !== undefined) {
      const internshipProgram =
        await InternshipProgram.findById(program);

      if (!internshipProgram) {
        return res.status(404).json({
          success: false,
          message: "Internship program not found",
        });
      }

      test.program = program;
    }

    // =================================================
    // BASIC TEST DETAILS
    // =================================================

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Test title is required",
        });
      }

      test.title = title.trim();
    }

    if (description !== undefined) {
      test.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    if (duration !== undefined) {
      const numericDuration = Number(duration);

      if (
        !Number.isFinite(numericDuration) ||
        numericDuration < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Duration must be at least 1 minute",
        });
      }

      test.duration = numericDuration;
    }

    if (totalMarks !== undefined) {
      const numericTotalMarks = Number(totalMarks);

      if (
        !Number.isFinite(numericTotalMarks) ||
        numericTotalMarks < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Total marks must be at least 1",
        });
      }

      test.totalMarks = numericTotalMarks;
    }

    if (passingMarks !== undefined) {
      const numericPassingMarks =
        Number(passingMarks);

      if (
        !Number.isFinite(numericPassingMarks) ||
        numericPassingMarks < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot be negative",
        });
      }

      test.passingMarks = numericPassingMarks;
    }

    // =================================================
    // MARKS VALIDATION
    // =================================================

    if (
      Number(test.passingMarks) >
      Number(test.totalMarks)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passing marks cannot be greater than total marks",
      });
    }

    // =================================================
    // INSTRUCTIONS
    // =================================================

    if (instructions !== undefined) {
      test.instructions = Array.isArray(instructions)
        ? instructions
        : [];
    }

    // =================================================
    // DATES
    // =================================================

    if (startDate !== undefined) {
      test.startDate = startDate || null;
    }

    if (endDate !== undefined) {
      test.endDate = endDate || null;
    }

    // =================================================
    // STATUS
    // =================================================

    if (status !== undefined) {
      if (
        !["draft", "published", "closed"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid test status",
        });
      }

      test.status = status;
    }

    // =================================================
    // ASSIGNED STUDENTS
    // =================================================

    if (assignedStudents !== undefined) {
      test.assignedStudents =
        Array.isArray(assignedStudents)
          ? assignedStudents
          : [];
    }

    // =================================================
    // QUESTIONS VALIDATION
    // =================================================

    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: "Questions must be an array",
        });
      }

      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "At least one question is required",
        });
      }

      const invalidQuestion = questions.find(
        (question) => {
          if (
            !question ||
            typeof question !== "object"
          ) {
            return true;
          }

          const options =
            Array.isArray(question.options)
              ? question.options.map((option) =>
                  typeof option === "string"
                    ? option.trim()
                    : ""
                )
              : [];

          const correctAnswer =
            typeof question.correctAnswer ===
            "string"
              ? question.correctAnswer.trim()
              : "";

          return (
            typeof question.questionText !==
              "string" ||
            !question.questionText.trim() ||
            options.length < 2 ||
            options.some((option) => !option) ||
            !correctAnswer ||
            !options.includes(correctAnswer) ||
            !Number.isFinite(
              Number(question.marks)
            ) ||
            Number(question.marks) < 1
          );
        }
      );

      if (invalidQuestion) {
        return res.status(400).json({
          success: false,
          message:
            "Each question must have text, valid options, a correct answer and positive marks",
        });
      }

      const questionTotalMarks =
        questions.reduce(
          (total, question) =>
            total + Number(question.marks),
          0
        );

      if (
        questionTotalMarks !==
        Number(test.totalMarks)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Total marks must equal the sum of question marks",
        });
      }
    }

    // =================================================
    // SAVE TEST
    // =================================================

    const updatedTest = await test.save();

    // =================================================
    // REPLACE QUESTIONS
    // =================================================

    if (questions !== undefined) {
      await Question.deleteMany({
        test: updatedTest._id,
      });

      await Question.insertMany(
        questions.map((question, index) => ({
          test: updatedTest._id,
          questionText:
            question.questionText.trim(),
          options: question.options.map((option) =>
            option.trim()
          ),
          correctAnswer:
            question.correctAnswer.trim(),
          marks: Number(question.marks),
          explanation:
            typeof question.explanation === "string"
              ? question.explanation.trim()
              : "",
          order:
            Number(question.order) || index + 1,
        }))
      );
    }

    // =================================================
    // POPULATE
    // =================================================

    const populatedTest =
      await Test.findById(updatedTest._id)
        .populate(
          "program",
          "title domain duration"
        )
        .populate(
          "createdBy",
          "name email"
        );

    const updatedQuestions =
      await Question.find({
        test: updatedTest._id,
      }).sort({ order: 1 });

    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
      test: populatedTest,
      questions: updatedQuestions,
    });
  } catch (error) {
    console.error("Update test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update test",
    });
  }
};


// =====================================================
// DELETE TEST
// DELETE /api/tests/:id
// ADMIN ONLY
// =====================================================
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    await Question.deleteMany({ test: test._id });
    await Test.findByIdAndDelete(test._id);

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Delete test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete test",
    });
  }
};


// =====================================================
// STUDENT - GET INTERNSHIP TEST
// GET /api/tests/internship/:programId
// SHORTLISTED STUDENTS ONLY
// =====================================================
export const getInternshipTest = async (req, res) => {
  try {
    const { programId } = req.params;

    const accessToken =
      req.headers["x-internship-token"] ||
      req.query.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message:
          "Please apply for this internship first.",
      });
    }

    const application =
      await InternshipApplication.findOne({
        program: programId,
        accessToken,
      });

    if (!application) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid internship application access.",
      });
    }

    if (application.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          application.status === "pending"
            ? "Your internship application is still waiting for admin approval."
            : "Your internship application was rejected.",
        status: application.status,
      });
    }

    const test = await Test.findOne({
      program: programId,
      status: "published",
    }).populate(
      "program",
      "title domain duration"
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message:
          "No published test is available for this internship yet.",
      });
    }

    const now = new Date();

    if (
      test.startDate &&
      now < new Date(test.startDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The test has not started yet.",
      });
    }

    if (
      test.endDate &&
      now > new Date(test.endDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The test has ended.",
      });
    }

    const questions =
      await Question.find({
        test: test._id,
      })
        .select(
          "_id questionText options marks order"
        )
        .sort({ order: 1 });

    return res.status(200).json({
      success: true,

      candidate: {
        name: application.name,
        email: application.email,
        phone: application.phone,
      },

      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        instructions: test.instructions,
        program: test.program,
      },

      questions,
    });
  } catch (error) {
    console.error(
      "Get internship test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load internship test",
    });
  }
};


// =====================================================
// STUDENT - START TEST
// POST /api/tests/:testId/start
// SHORTLISTED STUDENTS ONLY
// =====================================================
export const startInternshipTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user._id;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // Check application
    const application =
      await InternshipApplication.findOne({
        program: test.program,
        applicant: studentId,
      });

    if (!application) {
      return res.status(403).json({
        success: false,
        message:
          "You have not applied for this internship.",
      });
    }

    // Only admin-approved applicants can start.
    if (application.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your application has not been approved for the test yet.",
      });
    }

    if (test.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This test is not currently available.",
      });
    }

    // Check existing attempt
    let attempt = await TestAttempt.findOne({
      student: studentId,
      test: testId,
      status: "in_progress",
    });

    if (!attempt) {
      attempt = await TestAttempt.create({
        student: studentId,
        test: testId,
        startedAt: new Date(),
        status: "in_progress",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test started successfully.",
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      duration: test.duration,
    });
  } catch (error) {
    console.error(
      "Start internship test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to start test.",
    });
  }
};