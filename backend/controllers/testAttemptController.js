import Test from "../models/Test.js";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";
import InternshipApplication from "../models/InternshipApplication.js";

// =====================================================
// START TEST
// POST /api/test-attempts/start/:testId
// STUDENT
// =====================================================
export const startTest = async (req, res) => {
  try {
    const { testId } = req.params;

    const accessToken =
      req.headers["x-internship-token"] ||
      req.body?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message:
          "Please apply for this internship first.",
      });
    }

    const test =
      await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    const application =
      await InternshipApplication.findOne({
        program: test.program,
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
          "Your internship application has not been approved for the test yet.",
        status: application.status,
      });
    }

    if (test.status !== "published") {
      return res.status(400).json({
        success: false,
        message:
          "This test is not currently available.",
      });
    }

    const now = new Date();

    if (
      test.startDate &&
      now < new Date(test.startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "This test has not started yet.",
      });
    }

    if (
      test.endDate &&
      now > new Date(test.endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "This test has already ended.",
      });
    }

    // Anonymous internship applicants are not checked against
    // assignedStudents because that field contains User IDs.
    // Public access is controlled by the approved application token.

    let attempt =
      await TestAttempt.findOne({
        application: application._id,
        test: testId,
        status: "in_progress",
      });

    if (!attempt) {
      attempt =
        await TestAttempt.create({
          student:
            application.applicant || null,

          candidateName:
            application.name,

          candidateEmail:
            application.email,

          candidatePhone:
            application.phone || "",

          application:
            application._id,

          test: testId,

          startedAt: new Date(),

          answers: [],

          score: 0,

          percentage: 0,

          passed: false,

          status: "in_progress",
        });
    }

    return res.status(201).json({
      success: true,
      message:
        "Test started successfully.",

      attempt: {
        _id: attempt._id,
        candidateName:
          attempt.candidateName,
        candidateEmail:
          attempt.candidateEmail,
        startedAt:
          attempt.startedAt,
        status:
          attempt.status,
      },

      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        instructions: test.instructions,
      },
    });
  } catch (error) {
    console.error(
      "Start public test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to start test.",
    });
  }
};

// =====================================================
// SUBMIT TEST
// POST /api/test-attempts/:attemptId/submit
// PUBLIC APPLICATION TOKEN REQUIRED
// =====================================================

export const submitTest = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const accessToken =
      req.headers["x-internship-token"] ||
      req.body?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message:
          "Application access is required.",
      });
    }

    const attempt =
      await TestAttempt.findById(
        attemptId
      );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message:
          "Test attempt not found.",
      });
    }

    const application =
      await InternshipApplication.findOne({
        _id: attempt.application,
        accessToken,
      });

    if (!application) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to submit this attempt.",
      });
    }

    if (
      attempt.status !== "in_progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This test attempt has already been submitted.",
      });
    }

    const test =
      await Test.findById(
        attempt.test
      );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    if (application.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "You are not approved to take this test.",
      });
    }

    const questions =
      await Question.find({
        test: test._id,
      }).sort({
        order: 1,
        createdAt: 1,
      });

    const submittedAnswers =
      Array.isArray(req.body?.answers)
        ? req.body.answers
        : [];

    let score = 0;

    const evaluatedAnswers =
      questions.map((question) => {
        const submitted =
          submittedAnswers.find(
            (answer) =>
              answer?.question?.toString() ===
              question._id.toString()
          );

        const selectedAnswer =
          submitted?.selectedAnswer !==
          undefined
            ? submitted.selectedAnswer
            : null;

        const isCorrect =
          selectedAnswer !== null &&
          selectedAnswer ===
            question.correctAnswer;

        const marksObtained =
          isCorrect
            ? Number(
                question.marks || 0
              )
            : 0;

        score += marksObtained;

        return {
          question:
            question._id,
          selectedAnswer,
          isCorrect,
          marksObtained,
        };
      });

    const percentage =
      Number(test.totalMarks) > 0
        ? Number(
            (
              (score /
                Number(test.totalMarks)) *
              100
            ).toFixed(2)
          )
        : 0;

    const passed =
      score >=
      Number(test.passingMarks);

    const elapsedMinutes =
      (Date.now() -
        new Date(
          attempt.startedAt
        ).getTime()) /
      (1000 * 60);

    const expired =
      elapsedMinutes >
      Number(test.duration);

    attempt.answers =
      evaluatedAnswers;

    attempt.score =
      score;

    attempt.percentage =
      percentage;

    attempt.passed =
      passed;

    attempt.submittedAt =
      new Date();

    attempt.status =
      expired
        ? "expired"
        : "submitted";

    await attempt.save();

    return res.status(200).json({
      success: true,

      message: expired
        ? "Test submitted after the allowed time."
        : "Test submitted successfully.",

      result: {
        attemptId:
          attempt._id,
        candidateName:
          attempt.candidateName,
        candidateEmail:
          attempt.candidateEmail,
        score,
        totalMarks:
          test.totalMarks,
        percentage,
        passingMarks:
          test.passingMarks,
        passed,
        status:
          attempt.status,
        submittedAt:
          attempt.submittedAt,
      },
    });
  } catch (error) {
    console.error(
      "Submit public test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit test.",
    });
  }
};

// =====================================================
// GET MY ATTEMPT
// GET /api/test-attempts/my/:attemptId
// REGISTERED USERS ONLY
// =====================================================

// =====================================================
// GET MY ATTEMPT
// GET /api/test-attempts/my/:attemptId
// STUDENT
// =====================================================
export const getMyAttempts = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await TestAttempt.findById(attemptId)
      .populate(
        "test",
        "title description duration totalMarks passingMarks instructions"
      )
      .populate("student", "name email");

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found.",
      });
    }

    // =====================================================
    // CHECK OWNERSHIP
    // =====================================================

    if (
      attempt.student._id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this attempt.",
      });
    }

    return res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test attempt.",
    });
  }
};





// =====================================================
// GET SINGLE ATTEMPT - ADMIN
// =====================================================

export const getAdminAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await TestAttempt.findById(attemptId)
      .populate("student", "name email")
      .populate(
        "test",
        "title description duration totalMarks passingMarks program"
      )
      .populate(
        "answers.question",
        "questionText options correctAnswer marks explanation order"
      );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    return res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get admin attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get test attempt",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TEST ATTEMPTS
// GET /api/test-attempts/my
// STUDENT
// =====================================================
// =====================================================
// GET MY ATTEMPT
// =====================================================

export const getMyAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await TestAttempt.findOne({
      _id: attemptId,
      student: req.user._id,
    })
      .populate("student", "name email")
      .populate(
        "test",
        "title description duration totalMarks passingMarks"
      )
      .populate(
        "answers.question",
        "questionText options correctAnswer marks explanation order"
      );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    return res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get my attempt error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get test attempt",
      error: error.message,
    });
  }
};


// =====================================================
// GET ALL ATTEMPTS - ADMIN
// =====================================================

export const getAllAttempts = async (req, res) => {
  try {
    const attempts = await TestAttempt.find()
      .populate("student", "name email")
      .populate(
        "test",
        "title description duration totalMarks passingMarks program"
      )
      .populate(
        "answers.question",
        "questionText options correctAnswer marks explanation order"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error("Get all attempts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get test attempts",
      error: error.message,
    });
  }
};