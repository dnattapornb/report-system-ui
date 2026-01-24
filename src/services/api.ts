import axios from 'axios';

// Get the Base URL from Environment Variables
const baseURL = import.meta.env.VITE_API_BASE_URL;

// Create an Axios instance with default configurations
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
