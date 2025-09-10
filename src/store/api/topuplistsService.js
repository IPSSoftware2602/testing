import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;
const token = sessionStorage.getItem('token');

class TopUpService {
  async fetchTopupLists() {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}customer/topup/list`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      //  console.log("Fetched topup settings data:", data);
      
      let topupSettings = [];
      if (Array.isArray(data)) {
        topupSettings = data;
      } else if (Array.isArray(data.data)) {
        topupSettings = data.data;
      } else if (Array.isArray(data.result)) {
        topupSettings = data.result;
      }
      
      return topupSettings;
    } catch (error) {
      console.error('Error fetching topup settings:', error);
      throw new Error('Failed to load topup settings. Please try again.');
    }
  }

  async deleteTopupSetting(id) {
    try {
      const response = await fetch(`${BASE_URL}customer/topup/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting topup setting:', error);
      throw new Error('Failed to delete topup setting. Please try again.');
    }
  }
}

const topupService = new TopUpService();
export default topupService;