const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('careerai_token');
export const setStoredToken = (token) => localStorage.setItem('careerai_token', token);
export const removeStoredToken = () => localStorage.removeItem('careerai_token');

export async function authFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is an object and not FormData, stringify it
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.startsWith('http') ? url : `${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    removeStoredToken();
    window.dispatchEvent(new Event('careerai_auth_expired'));
  }

  return response;
}

export const api = {
  // Auth
  auth: {
    login: async (username, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return res;
    },
    register: async (username, email, password) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      return res;
    },
    me: async () => {
      const res = await authFetch('/auth/me');
      return res;
    },
    logout: () => {
      removeStoredToken();
    }
  },

  // Catalogs
  catalog: {
    getSkills: async () => {
      const res = await authFetch('/catalog/skills');
      return res.json();
    },
    getRoles: async () => {
      const res = await authFetch('/catalog/roles');
      return res.json();
    }
  },

  // Profile
  profile: {
    get: async () => {
      const res = await authFetch('/profile');
      return res.json();
    },
    update: async (data) => {
      const res = await authFetch('/profile', {
        method: 'PUT',
        body: data,
      });
      return res.json();
    },
    addSkill: async (skill) => {
      const res = await authFetch('/profile/skills/add', {
        method: 'POST',
        body: { skill },
      });
      return res.json();
    },
    removeSkill: async (skill) => {
      const res = await authFetch('/profile/skills/remove', {
        method: 'POST',
        body: { skill },
      });
      return res.json();
    },
    addInterest: async (interest) => {
      const res = await authFetch('/profile/interests/add', {
        method: 'POST',
        body: { interest },
      });
      return res.json();
    },
    removeInterest: async (interest) => {
      const res = await authFetch('/profile/interests/remove', {
        method: 'POST',
        body: { interest },
      });
      return res.json();
    },
    uploadPhoto: async (photoDataOrFile) => {
      if (typeof photoDataOrFile === 'string') {
        const res = await authFetch('/profile/photo', {
          method: 'POST',
          body: { photo_data: photoDataOrFile }
        });
        return res.json();
      } else {
        const formData = new FormData();
        formData.append('file', photoDataOrFile);
        const res = await authFetch('/profile/photo', {
          method: 'POST',
          body: formData
        });
        return res.json();
      }
    },
    removePhoto: async () => {
      const res = await authFetch('/profile/photo', {
        method: 'DELETE'
      });
      return res.json();
    }
  },

  // Notifications
  notifications: {
    list: async () => {
      const res = await authFetch('/notifications');
      return res.json();
    },
    markRead: async (notifId) => {
      const res = await authFetch(`/notifications/${notifId}/read`, {
        method: 'POST'
      });
      return res.json();
    },
    markAllRead: async () => {
      const res = await authFetch('/notifications/read-all', {
        method: 'POST'
      });
      return res.json();
    },
    clear: async () => {
      const res = await authFetch('/notifications/clear', {
        method: 'DELETE'
      });
      return res.json();
    }
  },

  // Dashboard Stats
  dashboard: {
    getStats: async () => {
      const res = await authFetch('/dashboard/stats');
      return res.json();
    }
  },

  // Resume
  resume: {
    upload: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('/resume/upload', {
        method: 'POST',
        body: formData,
      });
      return res.json();
    }
  },

  // Career Predictions & Skill Gap
  career: {
    getPredictions: async () => {
      const res = await authFetch('/career/predictions');
      return res.json();
    },
    getSkillGap: async (roleId) => {
      const res = await authFetch(`/career/skill-gap?role=${encodeURIComponent(roleId)}`);
      return res.json();
    }
  },

  // Jobs & Applications
  jobs: {
    list: async (search = '', location = '', jobType = '') => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location && location !== 'All') params.append('location', location);
      if (jobType && jobType !== 'All') params.append('job_type', jobType);
      const res = await authFetch(`/jobs?${params.toString()}`);
      return res.json();
    }
  },
  applications: {
    list: async () => {
      const res = await authFetch('/applications');
      return res.json();
    },
    create: async (data) => {
      const res = await authFetch('/applications', {
        method: 'POST',
        body: data,
      });
      return res.json();
    },
    updateStatus: async (appId, status) => {
      const res = await authFetch(`/applications/${appId}/status`, {
        method: 'PUT',
        body: { status },
      });
      return res.json();
    },
    delete: async (appId) => {
      const res = await authFetch(`/applications/${appId}`, {
        method: 'DELETE',
      });
      return res.json();
    }
  },

  // Coding Practice
  coding: {
    listProblems: async (difficulty = '', category = '', search = '') => {
      const params = new URLSearchParams();
      if (difficulty && difficulty !== 'All') params.append('difficulty', difficulty);
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      const res = await authFetch(`/coding/problems?${params.toString()}`);
      return res.json();
    },
    getProblem: async (slug) => {
      const res = await authFetch(`/coding/problems/${slug}`);
      return res.json();
    },
    runCode: async (slug, code, language = 'python') => {
      const res = await authFetch(`/coding/problems/${slug}/run`, {
        method: 'POST',
        body: { code, language },
      });
      return res.json();
    },
    submitCode: async (slug, code, language = 'python') => {
      const res = await authFetch(`/coding/problems/${slug}/submit`, {
        method: 'POST',
        body: { code, language },
      });
      return res.json();
    },
    getProgress: async () => {
      const res = await authFetch('/coding/progress');
      return res.json();
    }
  },

  // Mock Tests
  mockTests: {
    list: async () => {
      const res = await authFetch('/mock-tests');
      return res.json();
    },
    get: async (slug) => {
      const res = await authFetch(`/mock-tests/${slug}`);
      return res.json();
    },
    submit: async (slug, answers, timeSpentSeconds = 0) => {
      const res = await authFetch(`/mock-tests/${slug}/submit`, {
        method: 'POST',
        body: { answers, time_spent_seconds: timeSpentSeconds },
      });
      return res.json();
    }
  }
};

