

// src/services/api.js
import axios from "axios";


// / ✅ Both URLs defined
const LOCAL_API = "http://localhost:5000/api";
const PRODUCTION_API = "https://vprotech-digital1.onrender.com/api";

// ✅ Toggle between local and production (change this to switch)
const USE_LOCAL = false; // 👈 Set to true for local, false for production

// ✅ The actual URL being used
const API_URL = USE_LOCAL ? LOCAL_API : PRODUCTION_API;

console.log(`🔗 API URL: ${API_URL}`); // ✅ Shows which URL is active

export { API_URL }; 
// Create axios instance

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ AUTH SERVICES ============
export const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  verifyEmail: async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
},

resendVerification: async (email) => {
  const response = await api.post("/auth/resend-verification", {
    email: email.trim().toLowerCase(),
  });
  return response.data;
},
};




// ============ USER SERVICES (ADMIN) ============
export const userService = {
  getAllUsers: async () => {
    const response = await api.get("/auth/users");
    return response.data;
  },
  
  getUserStats: async () => {
    const response = await api.get("/auth/users/stats");
    return response.data;
  },
  
  updateUser: async (id, data) => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },
  
  toggleUserStatus: async (id) => {
    const response = await api.put(`/auth/users/${id}/toggle-status`);
    return response.data;
  },
};

// ============ BLOG SERVICES WITH CLOUDINARY ============
export const blogService = {
  // Get all published blogs (public)
  getBlogs: async () => {
    const response = await api.get("/blogs");
    return response.data;
  },
  
  // Get blog by ID (public)
  getBlogById: async (id) => {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  },
  
  // Get all blogs (admin only)
  getAdminBlogs: async () => {
    const response = await api.get("/blogs/admin/all");
    return response.data;
  },
  
  // Create blog with Cloudinary image upload
  createBlog: async (data) => {
    // Check if there's an image file to upload
    if (data.imageFile) {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.keys(data).forEach(key => {
        if (key === 'tags' && Array.isArray(data[key])) {
          // Convert tags array to JSON string
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'imageFile') {
          // Append the actual file
          formData.append('image', data[key]);
        } else if (key !== 'imageFile') {
          formData.append(key, data[key] || '');
        }
      });
      
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/blogs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
    
    // Regular JSON post (no image upload)
    const response = await api.post("/blogs", data);
    return response.data;
  },
  
  // Update blog with Cloudinary image upload
  updateBlog: async (id, data) => {
    // Check if there's an image file to upload
    if (data.imageFile) {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.keys(data).forEach(key => {
        if (key === 'tags' && Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'imageFile') {
          formData.append('image', data[key]);
        } else if (key !== 'imageFile') {
          formData.append(key, data[key] || '');
        }
      });
      
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/blogs/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
    
    // Regular JSON put (no image upload)
    const response = await api.put(`/blogs/${id}`, data);
    return response.data;
  },
  
  // Delete blog (admin only)
  deleteBlog: async (id) => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  },
  
  // Toggle publish status (admin only)
  togglePublish: async (id) => {
    const response = await api.put(`/blogs/${id}/toggle-publish`);
    return response.data;
  },
  
  // Like a blog (public)
  likeBlog: async (id) => {
    const response = await api.put(`/blogs/${id}/like`);
    return response.data;
  },
  
  // Get blog statistics (admin only)
  getBlogStats: async () => {
    const response = await api.get("/blogs/admin/stats");
    return response.data;
  },
  
  // Upload image only (admin only) - Cloudinary
  uploadImage: async (imageFile) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", imageFile);
    
    const response = await axios.post(`${API_URL}/blogs/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  
  // Delete image only (admin only) - Cloudinary
  deleteImage: async (publicId) => {
    const token = localStorage.getItem("token");
    const response = await api.delete(`/blogs/image`, {
      data: { publicId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// ============ CONTACT ADMIN SERVICES ============
export const contactAdminService = {
  getAllMessages: async (params = {}) => {
    const token = localStorage.getItem("token");
    const response = await api.get("/contact", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getMessageById: async (id) => {
    const token = localStorage.getItem("token");
    const response = await api.get(`/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateStatus: async (id, data) => {
    const token = localStorage.getItem("token");
    const response = await api.put(`/contact/${id}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteMessage: async (id) => {
    const token = localStorage.getItem("token");
    const response = await api.delete(`/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getStats: async () => {
    const token = localStorage.getItem("token");
    const response = await api.get("/contact/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// ============ CONTACT SERVICES (PUBLIC) ============
export const contactService = {
  sendContactMessage: async (data) => {
    const response = await api.post("/contact", data);
    return response.data;
  },
};


// ============ TEAM SERVICES ============
export const teamService = {
  // Get all team members (public)
  getTeamMembers: async () => {
    const response = await api.get("/team");
    return response.data;
  },

  // Get team member by ID (public)
  getTeamMemberById: async (id) => {
    const response = await api.get(`/team/${id}`);
    return response.data;
  },

  // Get all team members (admin only)
  getAdminTeamMembers: async () => {
    const response = await api.get("/team/admin/all");
    return response.data;
  },

  // Get team statistics (admin only)
  getTeamStats: async () => {
    const response = await api.get("/team/admin/stats");
    return response.data;
  },

  // Create team member (admin only)
  createTeamMember: async (data) => {
    // If there's an image file, use FormData
    if (data.imageFile) {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (key === 'skills' && Array.isArray(data[key])) {
          // Send each skill as separate field with same name
          data[key].forEach(skill => {
            formData.append('skills[]', skill);
          });
        } else if (key === 'socialLinks' && typeof data[key] === 'object') {
          // Send each social link as separate field
          Object.keys(data[key]).forEach(linkKey => {
            if (data[key][linkKey]) {
              formData.append(`socialLinks[${linkKey}]`, data[key][linkKey]);
            }
          });
        } else if (key !== 'imageFile') {
          formData.append(key, data[key]);
        }
      });
      
      formData.append('image', data.imageFile);
      
      const response = await api.post("/team", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    
    // Regular JSON post
    const response = await api.post("/team", data);
    return response.data;
  },

  // Update team member (admin only)
  updateTeamMember: async (id, data) => {
    if (data.imageFile) {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (key === 'skills' && Array.isArray(data[key])) {
          data[key].forEach(skill => {
            formData.append('skills[]', skill);
          });
        } else if (key === 'socialLinks' && typeof data[key] === 'object') {
          Object.keys(data[key]).forEach(linkKey => {
            if (data[key][linkKey]) {
              formData.append(`socialLinks[${linkKey}]`, data[key][linkKey]);
            }
          });
        } else if (key !== 'imageFile') {
          formData.append(key, data[key]);
        }
      });
      
      formData.append('image', data.imageFile);
      
      const response = await api.put(`/team/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    
    const response = await api.put(`/team/${id}`, data);
    return response.data;
  },

  // Delete team member (admin only)
  deleteTeamMember: async (id) => {
    const response = await api.delete(`/team/${id}`);
    return response.data;
  },

  // Toggle team member status (admin only)
  toggleTeamMemberStatus: async (id) => {
    const response = await api.put(`/team/${id}/toggle-status`);
    return response.data;
  },

  // Upload team member image (admin only)
  uploadTeamImage: async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    
    const response = await api.post("/team/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};


// ============ JOB SERVICES ============
export const jobService = {
  // Get all active jobs (public)
  getJobs: async () => {
    const response = await api.get("/jobs");
    return response.data;
  },

  // Get job by ID (public)
  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // Get all jobs (admin only)
  getAdminJobs: async () => {
    const response = await api.get("/jobs/admin/all");
    return response.data;
  },

  // Get job statistics (admin only)
  getJobStats: async () => {
    const response = await api.get("/jobs/admin/stats");
    return response.data;
  },

  // Create job (admin only)
  createJob: async (data) => {
    const response = await api.post("/jobs", data);
    return response.data;
  },

  // Update job (admin only)
  updateJob: async (id, data) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  // Delete job (admin only)
  deleteJob: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  // Toggle job status (admin only)
  toggleJobStatus: async (id) => {
    const response = await api.put(`/jobs/${id}/toggle-status`);
    return response.data;
  },
};

export const offerService = {
  getPopupOffers: async () => {
    const response = await api.get("/offers/popup");
    return response.data;
  },

  getAdminOffers: async () => {
    const response = await api.get("/offers/admin/all");
    return response.data;
  },

  createOffer: async (data) => {
    const response = await api.post("/offers", data);
    return response.data;
  },

  updateOffer: async (id, data) => {
    const response = await api.put(`/offers/${id}`, data);
    return response.data;
  },

  deleteOffer: async (id) => {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/offers/${id}/toggle`);
    return response.data;
  },

  togglePopup: async (id) => {
    const response = await api.patch(`/offers/${id}/toggle-popup`);
    return response.data;
  },
};


export default api;