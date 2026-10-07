import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ClipboardList,
  Loader2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { getAdminAttempt } from "../../services/testService";

import "./AdminTestAttemptDetails.css";

const AdminTestAttemptDetails = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);

      const data = await getAdminAttempt(attemptId);

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load result");
      }

      setAttempt(data.attempt);
    } catch (error) {
      console.error(
        "Load attempt details error:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load test result"
      );
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTimeTaken = () => {
    if (!attempt?.startedAt) return "—";

    const end =
      attempt.submittedAt
        ? new Date(attempt.submittedAt)
        : new Date();

    const start = new Date(attempt.startedAt);

    const seconds = Math.max(
      0,
      Math.floor((end - start) / 1000)
    );

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="admin-result-loading">
        <Loader2
          size={36}
          className="result-spinner"
        />
        <p>Loading test result...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="admin-result-empty">
        <XCircle size={45} />

        <h2>Result Not Found</h2>

        <p>
          The requested test attempt could not be found.
        </p>

        <button
          onClick={() =>
            navigate("/admin/test-attempts")
          }
        >
          <ArrowLeft size={17} />
          Back to Results
        </button>
      </div>
    );
  }

  const test = attempt.test || {};
  const student = attempt.student || {};

  const candidateName =
    student.name ||
    student.fullName ||
    attempt.candidateName ||
    "Unknown Student";

  const candidateEmail =
    student.email ||
    attempt.candidateEmail ||
    "—";

  return (
    <div className="admin-result-page">

      {/* HEADER */}

      <div className="admin-result-header">

        <div>
          <Link
            to="/admin/test-attempts"
            className="result-back-link"
          >
            <ArrowLeft size={17} />
            Back to Results
          </Link>

          <h1>Test Result</h1>

          <p>
            Detailed result and answers of the student.
          </p>
        </div>

      </div>

      {/* STUDENT + TEST */}

      <div className="result-info-grid">

        <div className="result-info-card">

          <div className="result-card-icon">
            <User size={22} />
          </div>

          <div>
            <span>Student</span>

            <strong>
              {candidateName}
            </strong>

            <small>
              {candidateEmail}
            </small>
          </div>

        </div>

        <div className="result-info-card">

          <div className="result-card-icon">
            <ClipboardList size={22} />
          </div>

          <div>
            <span>Test</span>

            <strong>
              {test.title || "Unknown Test"}
            </strong>

            <small>
              Duration: {test.duration || 0} minutes
            </small>
          </div>

        </div>

      </div>

      {/* RESULT SUMMARY */}

      <div className="result-summary-grid">

        <div className="result-summary-card">

          <div className="summary-result-icon">
            <Award size={23} />
          </div>

          <span>Score</span>

          <strong>
            {attempt.score ?? 0}
            {" / "}
            {test.totalMarks ?? "—"}
          </strong>

        </div>

        <div className="result-summary-card">

          <div className="summary-result-icon">
            <ClipboardList size={23} />
          </div>

          <span>Percentage</span>

          <strong>
            {attempt.percentage ?? 0}%
          </strong>

        </div>

        <div className="result-summary-card">

          <div className="summary-result-icon">
            <Clock size={23} />
          </div>

          <span>Time Taken</span>

          <strong>
            {getTimeTaken()}
          </strong>

        </div>

        <div
          className={`result-summary-card ${
            attempt.passed
              ? "passed-card"
              : "failed-card"
          }`}
        >

          {attempt.passed ? (
            <CheckCircle size={27} />
          ) : (
            <XCircle size={27} />
          )}

          <span>Result</span>

          <strong>
            {attempt.passed
              ? "Passed"
              : "Failed"}
          </strong>

        </div>

      </div>

      {/* ATTEMPT INFORMATION */}

      <div className="attempt-info-card">

        <h2>Attempt Information</h2>

        <div className="attempt-info-grid">

          <div>
            <span>Status</span>

            <strong className={`attempt-detail-status ${attempt.status}`}>
              {attempt.status
                ?.replace("_", " ")
                .toUpperCase()}
            </strong>
          </div>

          <div>
            <span>Started At</span>
            <strong>
              {formatDate(attempt.startedAt)}
            </strong>
          </div>

          <div>
            <span>Submitted At</span>
            <strong>
              {formatDate(attempt.submittedAt)}
            </strong>
          </div>

          <div>
            <span>Passing Marks</span>
            <strong>
              {test.passingMarks ?? "—"}
            </strong>
          </div>

        </div>

      </div>

      {/* ANSWERS */}

      <div className="result-answers-section">

        <div className="answers-header">
          <div>
            <h2>Question-wise Result</h2>

            <p>
              Review student's answers and correct answers.
            </p>
          </div>
        </div>

        {attempt.answers?.length === 0 ? (
          <div className="no-result-answers">
            <ClipboardList size={40} />

            <h3>No Answers Found</h3>

            <p>
              This attempt does not contain any answers.
            </p>
          </div>
        ) : (
          <div className="result-answer-list">

            {attempt.answers
              .slice()
              .sort(
                (a, b) =>
                  (a.question?.order ?? 0) -
                  (b.question?.order ?? 0)
              )
              .map((answer, index) => {

                const question =
                  answer.question || {};

                const isCorrect =
                  answer.isCorrect === true;

                return (
                  <div
                    className={`result-question-card ${
                      isCorrect
                        ? "answer-correct"
                        : "answer-wrong"
                    }`}
                    key={`${question._id || index}-${index}`}
                  >

                    {/* QUESTION */}

                    <div className="result-question-header">

                      <div className="result-question-number">
                        Q{index + 1}
                      </div>

                      <div className="result-question-title">

                        <h3>
                          {question.questionText ||
                            "Question unavailable"}
                        </h3>

                        <span>
                          {answer.marksObtained ?? 0}
                          {" / "}
                          {question.marks ?? 0}
                          {" marks"}
                        </span>

                      </div>

                      <div className="answer-status">

                        {isCorrect ? (
                          <>
                            <CheckCircle size={18} />
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircle size={18} />
                            Incorrect
                          </>
                        )}

                      </div>

                    </div>

                    {/* OPTIONS */}

                    <div className="result-options">

                      {question.options?.map(
                        (option, optionIndex) => {

                          const selected =
                            option ===
                            answer.selectedAnswer;

                          const correct =
                            option ===
                            question.correctAnswer;

                          let optionClass =
                            "result-option";

                          if (correct) {
                            optionClass +=
                              " correct-option";
                          }

                          if (
                            selected &&
                            !correct
                          ) {
                            optionClass +=
                              " selected-wrong-option";
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={optionClass}
                            >

                              <span className="result-option-letter">
                                {String.fromCharCode(
                                  65 + optionIndex
                                )}
                              </span>

                              <span className="result-option-text">
                                {option}
                              </span>

                              {selected && (
                                <span className="selected-label">
                                  Student Answer
                                </span>
                              )}

                              {correct && (
                                <span className="correct-label">
                                  Correct Answer
                                </span>
                              )}

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* EXPLANATION */}

                    {question.explanation && (
                      <div className="result-explanation">

                        <strong>
                          Explanation:
                        </strong>

                        <p>
                          {question.explanation}
                        </p>

                      </div>
                    )}

                  </div>
                );
              })}

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminTestAttemptDetails;