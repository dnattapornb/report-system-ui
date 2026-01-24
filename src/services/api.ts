// src/services/api.ts
import axios from 'axios';

// [Thai] ดึงค่า Base URL จาก Environment Variables
// [Eng] Get the Base URL from Environment Variables
const baseURL = import.meta.env.VITE_API_BASE_URL;

// [Thai] สร้าง Axios instance พร้อมกำหนดค่าเริ่มต้น
// [Eng] Create an Axios instance with default configurations
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;