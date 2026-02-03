const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const fitnessService = {
  getWorkouts: async () => {
    const response = await fetch(`${API_URL}/workouts`);
    return response.json();
  },
  createWorkout: async (workout) => {
    const response = await fetch(`${API_URL}/workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workout),
    });
    return response.json();
  },
  deleteWorkout: async (id) => {
    const response = await fetch(`${API_URL}/workouts/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};