import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Add timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('forgeUser');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    // Personal Metrics
    age?: number
    gender?: string
    height?: number
    weight?: number
    targetWeight?: number
    // Fitness Profile
    fitnessLevel?: string
    goals?: string[]
    activityLevel?: string
    preferredWorkouts?: string[]
    workoutFrequency?: string
    workoutDuration?: string
    // Health & Lifestyle
    medicalConditions?: string[]
    injuries?: string
    dietaryPreferences?: string[]
    sleepHours?: string
    stressLevel?: string
    smokingStatus?: string
    // Preferences & Wallet
    preferredWorkoutTime?: string
    gymAccess?: string
    equipment?: string[]
    motivationLevel?: string
    walletAddress?: string
  }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
};

// Task API endpoints
export const taskApi = {
  // Get today's tasks
  getTodayTasks: () =>
    apiClient.get('/tasks/today'),
  
  // Get all user tasks
  getUserTasks: () =>
    apiClient.get('/tasks'),
  
  // Create a manual task
  createTask: (data: {
    title: string
    category: string
    difficulty: number
    duration: number
    xp_reward: number
    description?: string
  }) =>
    apiClient.post('/tasks', data),
  
  // Complete a task
  completeTask: (taskId: string) =>
    apiClient.post('/tasks/complete', { taskId }),
  
  // Delete a task
  deleteTask: (taskId: string) =>
    apiClient.delete(`/tasks/${taskId}`),
  
  // Generate single ML task
  generateMLTask: () =>
    apiClient.post('/tasks/generate-ml'),
  
  // Generate multiple ML tasks
  generateMLTasksBatch: (count: number = 4) =>
    apiClient.post('/tasks/generate-ml-batch', { count }),
};

// User API endpoints
export const userApi = {
  // Get user profile
  getProfile: () =>
    apiClient.get('/users/profile'),
  
  // Get user stats
  getStats: () =>
    apiClient.get('/users/stats'),
  
  // Update user profile
  updateProfile: (data: Record<string, any>) =>
    apiClient.put('/users/profile', data),
};

// Rank/Leaderboard API endpoints
export const rankApi = {
  // Get leaderboard
  getLeaderboard: () =>
    apiClient.get('/ranks/leaderboard'),
  
  // Get user rank
  getUserRank: (userId: string) =>
    apiClient.get(`/ranks/${userId}`),
};

export default apiClient;
