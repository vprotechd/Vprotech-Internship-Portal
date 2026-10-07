import mongoose from "mongoose";

const internshipApplicationSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipProgram",
      required: true,
    },

    // Kept for existing/logged-in users, but NOT required
    // for public internship applicants.
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    education: {
      type: String,
      required: true,
      trim: true,
    },

    // Anonymous-student access token.
    // Sparse keeps existing old documents without this field valid.
    accessToken: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const InternshipApplication = mongoose.model(
  "InternshipApplication",
  internshipApplicationSchema
);

export default InternshipApplication;
