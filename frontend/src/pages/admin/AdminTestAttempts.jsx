import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardCheck,
  Eye,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { getAllAttempts } from "../../services/testService";

import "./AdminTestAttempts.css";

const AdminTestAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    try {
      setLoading(true);

      const response = await getAllAttempts();

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load test results"
        );
      }

      setAttempts(response.attempts || []);
    } catch (error) {
      console.error("Load test attempts error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load test results"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter((attempt) => {
    const studentName =
      attempt.student?.name ||
      attempt.student?.fullName ||
      attempt.user?.name ||
      attempt.candidateName ||
      "";

    const studentEmail =
      attempt.student?.email ||
      attempt.user?.email ||
      attempt.candidateEmail ||
      "";

    const testTitle =
      attempt.test?.title || "";

    const searchText =
      `${studentName} ${studentEmail} ${testTitle}`.toLowerCase();

    const matchesSearch =
      searchText.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      attempt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "submitted":
        return "attempt-status submitted";

      case "expired":
        return "attempt-status expired";

      case "in_progress":
        return "attempt-status progress";

      default:
        return "attempt-status";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="attempts-loading">
        <Loader2 size={36} className="attempts-spinner" />
        <p>Loading test results...</p>
      </div>
    );
  }

  return (
    <div className="admin-attempts-page">

      {/* HEADER */}
      <div className="attempts-header">

        <div>
          <Link
            to="/admin/tests"
            className="attempts-back"
          >
            <ArrowLeft size={17} />
            Back to Tests
          </Link>

          <h1>Test Results</h1>

          <p>
            View student test attempts, scores and results.
          </p>
        </div>

        <button
          className="refresh-attempts-btn"
          onClick={loadAttempts}
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* SUMMARY */}
      <div className="attempt-summary">

        <div className="attempt-summary-card">
          <ClipboardCheck size={22} />
          <div>
            <span>Total Attempts</span>
            <strong>{attempts.length}</strong>
          </div>
        </div>

        <div className="attempt-summary-card">
          <ClipboardCheck size={22} />
          <div>
            <span>Submitted</span>
            <strong>
              {
                attempts.filter(
                  (a) => a.status === "submitted"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="attempt-summary-card">
          <ClipboardCheck size={22} />
          <div>
            <span>Passed</span>
            <strong>
              {
                attempts.filter(
                  (a) => a.passed === true
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="attempt-summary-card">
          <ClipboardCheck size={22} />
          <div>
            <span>Failed</span>
            <strong>
              {
                attempts.filter(
                  (a) =>
                    a.status === "submitted" &&
                    a.passed === false
                ).length
              }
            </strong>
          </div>
        </div>

      </div>

      {/* FILTERS */}
      <div className="attempt-filters">

        <div className="attempt-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search student, email or test..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="expired">Expired</option>
          <option value="in_progress">
            In Progress
          </option>
        </select>

      </div>

      {/* TABLE */}
      <div className="attempts-table-wrapper">

        {filteredAttempts.length === 0 ? (
          <div className="no-attempts">
            <ClipboardCheck size={45} />

            <h3>No Test Results Found</h3>

            <p>
              Student test attempts will appear here
              after they start or submit a test.
            </p>
          </div>
        ) : (
          <table className="attempts-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Started</th>
                <th>Submitted</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Result</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredAttempts.map((attempt) => {

                const student =
                  attempt.student ||
                  attempt.user ||
                  {};

                const candidateName =
                  student.name ||
                  student.fullName ||
                  attempt.candidateName ||
                  "Unknown Student";

                const candidateEmail =
                  student.email ||
                  attempt.candidateEmail ||
                  "—";

                const percentage =
                  attempt.percentage ?? 0;

                return (
                  <tr key={attempt._id}>

                    <td>
                      <div className="student-info">

                        <strong>
                          {candidateName}
                        </strong>

                        <span>
                          {candidateEmail}
                        </span>

                      </div>
                    </td>

                    <td>
                      <strong>
                        {attempt.test?.title ||
                          "Unknown Test"}
                      </strong>
                    </td>

                    <td>
                      {formatDate(
                        attempt.startedAt
                      )}
                    </td>

                    <td>
                      {formatDate(
                        attempt.submittedAt
                      )}
                    </td>

                    <td>
                      <strong>
                        {attempt.score ?? 0}
                        {" / "}
                        {attempt.test?.totalMarks ??
                          "—"}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {percentage}%
                      </strong>
                    </td>

                    <td>

                      {attempt.status ===
                      "submitted" ? (
                        attempt.passed ? (
                          <span className="result-pass">
                            Passed
                          </span>
                        ) : (
                          <span className="result-fail">
                            Failed
                          </span>
                        )
                      ) : (
                        <span className="result-pending">
                          —
                        </span>
                      )}

                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          attempt.status
                        )}
                      >
                        {attempt.status
                          ?.replace("_", " ") ||
                          "Unknown"}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/admin/test-attempts/${attempt._id}`}
                        className="view-attempt-btn"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
};

export default AdminTestAttempts;