const API_BASE_URL = 'https://icom.ipsgroup.com.my/admin/'; // Change to your actual base URL

export const orderService = {
  getCustomerOrderList: async (user_id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      const response = await fetch(`${API_BASE_URL}/order/list?user_id=${user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order list');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getOrderById: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/order/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order with ID ${id}`);
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to fetch order');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  updateOrderSchedule: async (orderId, selectedDate, selectedTime) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/order/update-schedule/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_date: selectedDate,
          selected_time: selectedTime
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order schedule');
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to update order schedule');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating order schedule:', error);
      throw error;
    }
  },


  updateOrderStatus: async (orderId, status) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/order/update-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to update order status');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

 createOrderDelivery: async (deliveryData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate required fields
    if (!deliveryData.order_id || !deliveryData.actual_fee_amount || !deliveryData.tracking_link) {
      throw new Error('order_id, actual_fee_amount, and tracking_link are required');
    }

    const response = await fetch(`${API_BASE_URL}/order/create-deliveries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error creating order delivery:', error);
    throw error;
  }
},

  getOrderDelivery: async (orderId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await fetch(`${API_BASE_URL}order/get-delivery/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // If 404, return null instead of throwing error (assuming not found is a valid case)
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch order delivery');
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to fetch order delivery');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching order delivery:', error);
      throw error;
    }
  },

  updateOrderDelivery: async (deliveryId, updateData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!deliveryId) {
        throw new Error('Delivery ID is required');
      }

      // Filter out undefined values but keep empty strings
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const response = await fetch(`${API_BASE_URL}order/update-delivery/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order delivery');
      }

      const result = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to update order delivery');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating order delivery:', error);
      throw error;
    }
  },


  // You can add more order-related API calls here as needed
};