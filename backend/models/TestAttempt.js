import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    selectedAnswer: {
      type: String,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    marksObtained: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const testAttemptSchema = new mongoose.Schema(
  {
    // Existing registered-user support.
    // Anonymous internship candidates do not have this field.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    // Public candidate details
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },

    candidateEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    candidatePhone: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipApplication",
      required: true,
    },

    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  }
);

testAttemptSchema.index({
  student: 1,
  test: 1,
});

testAttemptSchema.index({
  application: 1,
  test: 1,
});

const TestAttempt = mongoose.model(
  "TestAttempt",
  testAttemptSchema
);

export default TestAttempt;
