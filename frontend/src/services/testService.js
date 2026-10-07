import axiosClient from "./api";

// =====================================================
// PUBLIC STUDENT TEST SERVICES
// Application token replaces student login.
// =====================================================

const getInternshipToken = () =>
  localStorage.getItem(
    "internshipAccessToken"
  );

const publicHeaders = () => {
  const token =
    getInternshipToken();

  return token
    ? {
        "x-internship-token": token,
      }
    : {};
};

// Get available test for internship program
export const getInternshipTest = async (
  programId
) => {
  const response =
    await axiosClient.get(
      `/tests/internship/${programId}`,
      {
        headers: publicHeaders(),
      }
    );

  return response.data;
};

// Start test
export const startTest = async (
  testId
) => {
  const token =
    getInternshipToken();

  const response =
    await axiosClient.post(
      `/test-attempts/start/${testId}`,
      {
        accessToken: token,
      },
      {
        headers: publicHeaders(),
      }
    );

  return response.data;
};

// Submit test
export const submitTest = async (
  attemptId,
  answers
) => {
  const token =
    getInternshipToken();

  const response =
    await axiosClient.post(
      `/test-attempts/${attemptId}/submit`,
      {
        answers,
        accessToken: token,
      },
      {
        headers: publicHeaders(),
      }
    );

  return response.data;
};

// =====================================================
// Existing registered-user services
// =====================================================

export const getMyAttempt = async (
  attemptId
) => {
  const response =
    await axiosClient.get(
      `/test-attempts/my/${attemptId}`
    );

  return response.data;
};

export const getMyAttempts = async () => {
  const response =
    await axiosClient.get(
      `/test-attempts/my`
    );

  return response.data;
};

// =====================================================
// ADMIN
// =====================================================

export const getAdminAttempt = async (
  attemptId
) => {
  const response =
    await axiosClient.get(
      `/test-attempts/admin/${attemptId}`
    );

  return response.data;
};

export const createTest = async (data) => {
  const response =
    await axiosClient.post(
      `/tests`,
      data
    );

  return response.data;
};

export const getAllTests = async () => {
  const response =
    await axiosClient.get(
      `/tests`
    );

  return response.data;
};

export const getTestById = async (id) => {
  const response =
    await axiosClient.get(
      `/tests/${id}`
    );

  return response.data;
};

export const updateTest = async (
  id,
  data
) => {
  const response =
    await axiosClient.put(
      `/tests/${id}`,
      data
    );

  return response.data;
};

export const deleteTest = async (id) => {
  const response =
    await axiosClient.delete(
      `/tests/${id}`
    );

  return response.data;
};

export const getAllAttempts =
  async () => {
    const response =
      await axiosClient.get(
        `/test-attempts/all`
      );

    return response.data;
  };
