import api from "./api";

// =====================================================
// PUBLIC INTERNSHIP SERVICES
// =====================================================

export const getInternshipPrograms = async () => {
  const response = await api.get(
    "/internship/programs"
  );

  return response.data;
};

export const getInternshipProgramById = async (id) => {
  const response = await api.get(
    `/internship/programs/${id}`
  );

  return response.data;
};

// =====================================================
// PUBLIC APPLICATION
// No account/login required.
// =====================================================

export const applyForInternship = async (
  programId,
  data
) => {
  const response = await api.post(
    `/internship/programs/${programId}/apply`,
    data
  );

  if (
    response.data?.success &&
    response.data?.accessToken
  ) {
    localStorage.setItem(
      "internshipAccessToken",
      response.data.accessToken
    );

    localStorage.setItem(
      "internshipApplication",
      JSON.stringify(
        response.data.application || {}
      )
    );
  }

  return response.data;
};

// =====================================================
// PUBLIC APPLICATION STATUS
// =====================================================

export const getPublicApplicationStatus =
  async (programId) => {
    const accessToken =
      localStorage.getItem(
        "internshipAccessToken"
      );

    if (!accessToken) {
      return {
        success: false,
        application: null,
      };
    }

    const response = await api.get(
      "/internship/application-status",
      {
        params: {
          programId,
        },
        headers: {
          "x-internship-token":
            accessToken,
        },
      }
    );

    if (
      response.data?.success &&
      response.data?.application
    ) {
      localStorage.setItem(
        "internshipApplication",
        JSON.stringify(
          response.data.application
        )
      );
    }

    return response.data;
  };

// =====================================================
// Existing logged-in student service
// =====================================================

export const getMyInternshipApplications =
  async () => {
    const response = await api.get(
      "/internship/my-applications"
    );

    return response.data;
  };
