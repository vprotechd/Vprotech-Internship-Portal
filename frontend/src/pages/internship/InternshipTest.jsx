import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getInternshipTest,
  startTest,
  submitTest,
} from "../../services/testService";

import "./InternshipTest.css";

export default function InternshipTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [attempt, setAttempt] = useState(null);

  const [answers, setAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(null);

  // =====================================================
  // FETCH TEST
  // =====================================================

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "internshipAccessToken"
        );

      if (!token) {
        toast.error(
          "Please apply for this internship first."
        );

        navigate(`/internship/${id}`);
        return;
      }

      const data =
        await getInternshipTest(id);

      console.log(
        "Internship test response:",
        data
      );

      if (!data?.success) {
        toast.error(
          data?.message ||
            "Unable to load test."
        );
        return;
      }

      setTest(
        data.test || null
      );

      setQuestions(
        data.questions || []
      );
    } catch (error) {
      console.error(
        "Fetch test error:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to load internship test."
      );

      // If access is invalid/expired, return to the
      // internship application page.
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        navigate(`/internship/${id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // START TEST
  // =====================================================

  const handleStartTest = async () => {
    if (!test?._id) {
      toast.error("Test information is missing.");
      return;
    }

    try {
      setStarting(true);

      const data = await startTest(test._id);

      console.log("Start test response:", data);

      if (!data?.success) {
        toast.error(
          data?.message || "Unable to start test."
        );
        return;
      }

      setAttempt(data.attempt);

      const durationMinutes = Number(
        data?.test?.duration || test.duration || 0
      );

      setTimeLeft(durationMinutes * 60);

      toast.success("Test started successfully.");
    } catch (error) {
      console.error(
        "Start test error:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to start test."
      );
    } finally {
      setStarting(false);
    }
  };

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null) {
          return null;
        }

        if (previous <= 1) {
          clearInterval(interval);

          toast.error(
            "Time is over. Submitting your test..."
          );

          handleSubmitTest(true);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt]);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) {
      return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // SELECT ANSWER
  // =====================================================

  const handleAnswerChange = (
    questionId,
    selectedAnswer
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer,
    }));
  };

  // =====================================================
  // SUBMIT TEST
  // =====================================================

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!attempt?._id) {
      return;
    }

    if (submitting) {
      return;
    }

    if (!autoSubmit) {
      const confirmed = window.confirm(
        "Are you sure you want to submit the test?"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const formattedAnswers = questions.map(
        (question) => ({
          question: question._id,
          selectedAnswer:
            answers[question._id] ?? null,
        })
      );

      console.log(
        "Submitting answers:",
        formattedAnswers
      );

      const data = await submitTest(
        attempt._id,
        formattedAnswers
      );

      console.log("Submit test response:", data);

      if (!data?.success) {
        toast.error(
          data?.message || "Failed to submit test."
        );
        return;
      }

      toast.success(
        autoSubmit
          ? "Test submitted automatically."
          : "Test submitted successfully."
      );

      // Go to result page
      navigate(
        `/internship/${id}/test/result/${attempt._id}`,
        {
          state: {
            result: data.result,
          },
        }
      );
    } catch (error) {
      console.error("Submit test error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to submit test."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="internship-test-page">
        <div className="internship-test-container">
          <div className="internship-test-state">
            <div className="internship-test-loader"></div>

            <p>Loading internship test...</p>
          </div>
        </div>
      </section>
    );
  }

  // =====================================================
  // TEST NOT FOUND
  // =====================================================

  if (!test) {
    return (
      <section className="internship-test-page">
        <div className="internship-test-container">
          <div className="internship-test-state">
            <AlertCircle size={45} />

            <h2>Test Not Available</h2>

            <p>
              {test?.message ||
                "No test is currently available for this internship."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(`/internship/${id}`)
              }
            >
              <ArrowLeft size={18} />
              Back to Internship
            </button>
          </div>
        </div>
      </section>
    );
  }

  // =====================================================
  // BEFORE START
  // =====================================================

  if (!attempt) {
    return (
      <section className="internship-test-page">
        <div className="internship-test-container">

          <button
            type="button"
            className="internship-test-back-btn"
            onClick={() =>
              navigate(`/internship/${id}`)
            }
          >
            <ArrowLeft size={18} />
            Back to Internship
          </button>

          <div className="internship-test-start-card">

            <div className="internship-test-start-icon">
              <CheckCircle size={50} />
            </div>

            <h1>{test.title}</h1>

            {test.description && (
              <p className="internship-test-description">
                {test.description}
              </p>
            )}

            <div className="internship-test-summary">

              <div>
                <Clock size={20} />

                <span>
                  Duration
                  <strong>
                    {test.duration} minutes
                  </strong>
                </span>
              </div>

              <div>
                <span>
                  Total Marks
                  <strong>
                    {test.totalMarks}
                  </strong>
                </span>
              </div>

              <div>
                <span>
                  Passing Marks
                  <strong>
                    {test.passingMarks}
                  </strong>
                </span>
              </div>

            </div>

            {test.instructions?.length > 0 && (
              <div className="internship-test-instructions">

                <h3>Instructions</h3>

                <ul>
                  {test.instructions.map(
                    (instruction, index) => (
                      <li key={index}>
                        {instruction}
                      </li>
                    )
                  )}
                </ul>

              </div>
            )}

            <button
              type="button"
              className="internship-test-start-btn"
              onClick={handleStartTest}
              disabled={starting}
            >
              {starting
                ? "Starting Test..."
                : "Start Test"}
            </button>

          </div>
        </div>
      </section>
    );
  }

  // =====================================================
  // TEST IN PROGRESS
  // =====================================================

  return (
    <section className="internship-test-page">
      <div className="internship-test-container">

        {/* HEADER */}

        <div className="internship-test-header">

          <div>
            <span>Internship Test</span>

            <h1>{test.title}</h1>
          </div>

          <div
            className={`internship-test-timer ${
              timeLeft !== null &&
              timeLeft <= 60
                ? "danger"
                : ""
            }`}
          >
            <Clock size={20} />

            {formatTime(timeLeft)}
          </div>

        </div>

        {/* QUESTIONS */}

        <div className="internship-test-questions">

          {questions.length === 0 ? (
            <div className="internship-test-state">
              <AlertCircle size={40} />

              <p>
                No questions have been added to this test yet.
              </p>
            </div>
          ) : (
            questions.map((question, index) => (
              <div
                className="internship-question-card"
                key={question._id}
              >

                <div className="internship-question-number">
                  Question {index + 1}
                </div>

                <h2>
                  {question.questionText}
                </h2>

                <div className="internship-question-options">

                  {Array.isArray(question.options) &&
                    question.options.map(
                      (option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`internship-option ${
                            answers[question._id] ===
                            option
                              ? "selected"
                              : ""
                          }`}
                        >

                          <input
                            type="radio"
                            name={`question-${question._id}`}
                            value={option}
                            checked={
                              answers[
                                question._id
                              ] === option
                            }
                            onChange={() =>
                              handleAnswerChange(
                                question._id,
                                option
                              )
                            }
                          />

                          <span>
                            {option}
                          </span>

                        </label>
                      )
                    )}

                </div>

                <small>
                  Marks: {question.marks}
                </small>

              </div>
            ))
          )}

        </div>

        {/* SUBMIT */}

        {questions.length > 0 && (
          <div className="internship-test-submit-section">

            <p>
              Answered{" "}
              <strong>
                {Object.keys(answers).length}
              </strong>{" "}
              of{" "}
              <strong>
                {questions.length}
              </strong>{" "}
              questions
            </p>

            <button
              type="button"
              className="internship-test-submit-btn"
              onClick={() =>
                handleSubmitTest(false)
              }
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Test"}
            </button>

          </div>
        )}

      </div>
    </section>
  );
}