import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  GraduationCap,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getInternshipProgramById,
  applyForInternship,
  getPublicApplicationStatus,
} from "../../services/internshipService";

import "./InternshipDetails.css";

export default function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applying, setApplying] = useState(false);

  // Student's application for this internship
  const [myApplication, setMyApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    education: "",
  });

  // =========================================================
  // FETCH INTERNSHIP PROGRAM
  // =========================================================

  useEffect(() => {
    fetchProgram();
    fetchMyApplication();
  }, [id]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getInternshipProgramById(id);

      if (data?.success) {
        setProgram(data.program);
      } else {
        setError("Internship program not found.");
      }
    } catch (err) {
      console.error("Internship details error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load internship details."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH MY APPLICATION
  // =========================================================

  const fetchMyApplication = async () => {
    try {
      setApplicationLoading(true);

      const data =
        await getPublicApplicationStatus(id);

      if (
        data?.success &&
        data?.application
      ) {
        setMyApplication(
          data.application
        );
      } else {
        setMyApplication(null);
      }
    } catch (err) {
      console.error(
        "Public internship application status error:",
        err?.response?.data || err
      );

      setMyApplication(null);
    } finally {
      setApplicationLoading(false);
    }
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // OPEN APPLICATION FORM
  // =========================================================

  const handleOpenApplyForm = () => {
    setShowApplyForm(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // =========================================================
  // CANCEL APPLICATION
  // =========================================================

  const handleCancelApplication = () => {
    if (applying) return;

    setShowApplyForm(false);

    setForm({
      name: "",
      email: "",
      phone: "",
      education: "",
    });
  };

  // =========================================================
  // APPLY FOR INTERNSHIP
  // =========================================================

  const handleApply = async (e) => {
    e.preventDefault();

    // Validate name
    if (!form.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    // Validate email
    if (!form.email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    // Validate phone
    if (!form.phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    // Validate education
    if (!form.education.trim()) {
      toast.error("Please enter your education.");
      return;
    }

    try {
      setApplying(true);

      const applicationData = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        education: form.education.trim(),
      };

      console.log(
        "========== INTERNSHIP APPLICATION =========="
      );

      console.log("Name:", applicationData.name);
      console.log("Email:", applicationData.email);
      console.log("Phone:", applicationData.phone);
      console.log("Education:", applicationData.education);

      const data = await applyForInternship(
        id,
        applicationData
      );

      console.log("Application response:", data);

      if (data?.success) {
        toast.success(
          "Application submitted successfully! Please wait for admin approval.",
          {
            duration: 5000,
          }
        );

        setShowApplyForm(false);

        setForm({
          name: "",
          email: "",
          phone: "",
          education: "",
        });

        // Refresh student's application status
        await fetchMyApplication();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        toast.error(
          data?.message ||
            "Failed to submit application."
        );
      }
    } catch (err) {
      console.error(
        "Internship application error:",
        err
      );

      console.error(
        "Backend response:",
        err?.response?.data
      );

      toast.error(
        err?.response?.data?.message ||
          "Failed to submit application."
      );
    } finally {
      setApplying(false);
    }
  };

  // =========================================================
  // START TEST
  // =========================================================

  const handleStartTest = () => {
    if (!myApplication) {
      toast.error("Please apply for this internship first.");
      return;
    }

    if (myApplication.status !== "approved") {
      toast.error(
        "Your application has not been approved for the test yet."
      );
      return;
    }

    navigate(`/internship/${id}/test`);
  };

  // =========================================================
  // APPLICATION STATUS SECTION
  // =========================================================

  const renderApplicationSection = () => {
    // While checking application
    if (applicationLoading) {
      return (
        <div className="internship-apply-section">
          <p>Checking your application status...</p>
        </div>
      );
    }

    // Only approved applicants can take the internship test.
    if (myApplication?.status === "approved") {
      return (
        <div className="internship-apply-section">
          <div className="internship-approved-message">
            <CheckCircle size={22} />

            <div>
              <strong>Application Approved</strong>

              <p>
                Your application has been approved. You can now
                take the internship test.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="internship-apply-btn"
            onClick={handleStartTest}
          >
            Start Test
          </button>
        </div>
      );
    }

    // Application pending
    if (myApplication?.status === "pending") {
      return (
        <div className="internship-apply-section">
          <div className="internship-approved-message">
            <CheckCircle size={22} />

            <div>
              <strong>Application Submitted</strong>

              <p>
                Your application is under review. Please wait for
                admin approval.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Application rejected
    if (myApplication?.status === "rejected") {
      return (
        <div className="internship-apply-section">
          <div className="internship-approved-message">
            <strong>Application Rejected</strong>

            <p>
              Unfortunately, your application was not approved.
            </p>
          </div>
        </div>
      );
    }

    // No application
    if (!showApplyForm) {
      return (
        <div className="internship-apply-section">
          <button
            type="button"
            className="internship-apply-btn"
            onClick={handleOpenApplyForm}
          >
            Apply Now
          </button>
        </div>
      );
    }

    return null;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="internship-details-page">
        <div className="internship-details-container">
          <div className="internship-details-state">
            <div className="internship-loader"></div>

            <p>
              Loading internship details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !program) {
    return (
      <section className="internship-details-page">
        <div className="internship-details-container">
          <div className="internship-details-state">
            <h2>
              Internship Not Found
            </h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                navigate("/internship")
              }
            >
              Back to Internships
            </button>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <section className="internship-details-page">
      <div className="internship-details-container">

        {/* BACK BUTTON */}

        <button
          type="button"
          className="internship-back-btn"
          onClick={() =>
            navigate("/internship")
          }
        >
          <ArrowLeft size={18} />

          Back to Internships
        </button>

        {/* MAIN CARD */}

        <div className="internship-details-card">

          {/* HEADER */}

          <div className="internship-details-header">

            <div className="internship-details-icon">
              <GraduationCap size={42} />
            </div>

            <div className="internship-details-title-area">

              <span className="internship-details-domain">
                {program.domain}
              </span>

              <h1>
                {program.title}
              </h1>

              {program.status === "active" && (
                <span className="internship-active">
                  Active
                </span>
              )}

            </div>

          </div>

          {/* INFORMATION */}

          <div className="internship-details-info">

            <div>
              <Calendar size={20} />

              <div>
                <small>
                  Duration
                </small>

                <strong>
                  {program.duration}
                </strong>
              </div>
            </div>

            <div>
              <Briefcase size={20} />

              <div>
                <small>
                  Domain
                </small>

                <strong>
                  {program.domain}
                </strong>
              </div>
            </div>

            <div>
              <MapPin size={20} />

              <div>
                <small>
                  Mode
                </small>

                <strong>
                  Training & Internship
                </strong>
              </div>
            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="internship-details-content">

            <h2>
              About This Internship
            </h2>

            <p>
              {program.description}
            </p>

            {program.eligibility && (
              <>
                <h2>
                  Eligibility
                </h2>

                <div className="internship-eligibility-box">

                  <CheckCircle size={20} />

                  <p>
                    {program.eligibility}
                  </p>

                </div>
              </>
            )}

          </div>

          {/* APPLICATION / TEST BUTTON */}

          <div className="internship-registration-notice" role="note">
            <AlertCircle size={20} />
            <p>
              No account registration is required. Apply using your
              name, email, phone number and education details. After
              admin approval, you can take the internship test.
            </p>
          </div>

          {renderApplicationSection()}

          {/* APPLICATION FORM */}

          {showApplyForm && !myApplication && (
            <div className="internship-application-form">

              <div className="internship-application-header">

                <h2>
                  Apply for Internship
                </h2>

                <p>
                  Fill in your details to submit your internship
                  application. After admin approval, you will be
                  able to take the internship test.
                </p>

              </div>

              <form onSubmit={handleApply}>

                {/* NAME + EMAIL */}

                <div className="internship-form-row">

                  <div className="internship-form-group">

                    <label>
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your full name"
                      required
                      disabled={applying}
                    />

                  </div>

                  <div className="internship-form-group">

                    <label>
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your email"
                      required
                      disabled={applying}
                    />

                  </div>

                </div>

                {/* PHONE + EDUCATION */}

                <div className="internship-form-row">

                  <div className="internship-form-group">

                    <label>
                      Phone *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your phone number"
                      required
                      disabled={applying}
                    />

                  </div>

                  <div className="internship-form-group">

                    <label>
                      Education *
                    </label>

                    <input
                      type="text"
                      name="education"
                      value={form.education}
                      onChange={
                        handleInputChange
                      }
                      placeholder="e.g. BCA, B.Tech, MCA"
                      required
                      disabled={applying}
                    />

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="internship-application-actions">

                  <button
                    type="button"
                    className="internship-cancel-btn"
                    onClick={
                      handleCancelApplication
                    }
                    disabled={applying}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="internship-submit-btn"
                    disabled={applying}
                  >
                    {applying
                      ? "Submitting..."
                      : "Submit Application"}
                  </button>

                </div>

              </form>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}