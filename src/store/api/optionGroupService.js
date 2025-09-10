import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class OptionGroupService {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async makeFormDataRequest(endpoint, formData, method = 'POST') {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`FormData API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getOptionGroupList() {
    return await this.makeRequest('option/list', {
      method: 'GET',
    });
  }

  async getOptionGroup(id) {
    return await this.makeRequest(`option/${id}`, {
      method: 'GET',
    });
  }

  // Create a new option group
  async createOptionGroup(optionGroupData) {
    const payload = this.transformToApiFormat(optionGroupData);
    console.log('Creating option group with payload:', payload);
    return await this.makeRequest('option/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Update an existing option group
  async updateOptionGroup(id, optionGroupData) {
    const payload = this.transformToApiFormat(optionGroupData);
    console.log('Updating option group with payload:', payload);

    // Make the update request
    const response = await this.makeRequest(`option/update/${id}`, {
      method: 'POST',
      body: payload,
    });

    console.log('Update response:', response);
    return response;
  }

  async updateOptionGroupIndex(orderMap) {
    return await this.makeRequest('menu-item/option-group/index', {
      method: 'POST',
      body: JSON.stringify({
        option_group_order: orderMap
      }),
    });
  }

  // Delete an option group
  async deleteOptionGroup(id) {
    const token = this.getToken();
    return await this.makeRequest(`option/delete/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: '',
    });
  }

  async updateOptionGroupNew(group_id, optionGroupData) {
    // if (!optionGroupData.name || !optionGroupData.name.trim()) {
    //   throw new Error('Option group name is required');
    // }

    const formData = new FormData();

    formData.append('id', optionGroupData.id || '');
    formData.append('title', optionGroupData.name.trim());
    formData.append('min_quantity', optionGroupData.minSelection || 0);
    formData.append('max_quantity', optionGroupData.maxSelection || 1);
    formData.append('is_required', optionGroupData.isOptional ? "0" : "1");
    formData.append('status', 'active');
    formData.append('order_index', optionGroupData.orderIndex || 0);

    if (Array.isArray(optionGroupData.options) && optionGroupData.options.length > 0) {
      optionGroupData.options.forEach((opt, idx) => {
        // Handle images for each option
        if (opt.images) {
          if (opt.images instanceof File) {
            // If it's a File object, append it directly
            formData.append(`image${idx}`, opt.images);
          } else if (typeof opt.images === 'string') {
            // If it's a string (URL or base64), append as string
            formData.append(`options[${idx}][images]`, opt.images);
          } else {
            // If it's null or other type, append empty string
            formData.append(`options[${idx}][images]`, '');
          }
        } else {
          formData.append(`image${idx}`, '');
        }

        if (opt.id) {
          formData.append(`options[${idx}][id]`, opt.id);
          formData.append(`options[${idx}][title]`, opt.name || opt.title || '');
          formData.append(`options[${idx}][price_adjustment]`, parseFloat(opt.price || opt.price_adjustment || 0));
          formData.append(`options[${idx}][order_index]`, opt.order_index || idx + 1);
        } else {
          formData.append(`options[${idx}][title]`, opt.name || opt.title || '');
          formData.append(`options[${idx}][price_adjustment]`, parseFloat(opt.price || opt.price_adjustment || 0));
          formData.append(`options[${idx}][order_index]`, opt.order_index || idx + 1);

          if (opt.id) {
            formData.append(`options[${idx}][id]`, opt.id);
          }
        }
      })
    }

    const response = await this.makeFormDataRequest(`option/update/${group_id}`, formData, 'POST');

    return response;
  }

  async updateOptionItem(optionItemId, formData, optionGroupData) {
    try {
      console.log('Updating option item:', optionItemId, formData);
      console.log('Option group data:', optionGroupData);

      if (!optionGroupData || !optionGroupData.id) {
        throw new Error('Option group data is required to update option item');
      }

      // Get the updated data from FormData
      const updateData = {
        title: formData.get('title'),
        price_adjustment: parseFloat(formData.get('price_adjustment'))
      };

      const updatedOptions = optionGroupData.options.map(option => {
        if (option.id.toString() === optionItemId.toString()) {
          return {
            ...option,
            ...updateData,
            id: option.id
          };
        }
        return option;
      });

      const optionGroupPayload = {
        title: optionGroupData.name || optionGroupData.title,
        min_quantity: optionGroupData.minSelection || 0,
        max_quantity: optionGroupData.maxSelection || 1,
        is_required: optionGroupData.isOptional ? "0" : "1",
        status: 'active',
        order_index: optionGroupData.orderIndex || 0,
        options: updatedOptions.map((opt, idx) => ({
          id: opt.id,
          title: opt.title || opt.name || '',
          price_adjustment: parseFloat(opt.price_adjustment || opt.price || 0),
          order_index: opt.order_index || idx + 1,
          images: opt.images || null,
          images_compressed: opt.images_compressed || null,
        }))
      };

      console.log('Updating option group with payload:', optionGroupPayload);

      const hasImageFile = formData.get('image') && formData.get('image') instanceof File;

      if (hasImageFile) {
        const groupFormData = new FormData();
        groupFormData.append('title', optionGroupPayload.title);
        groupFormData.append('min_quantity', optionGroupPayload.min_quantity.toString());
        groupFormData.append('max_quantity', optionGroupPayload.max_quantity.toString());
        groupFormData.append('is_required', optionGroupPayload.is_required);
        groupFormData.append('status', optionGroupPayload.status);
        groupFormData.append('order_index', optionGroupPayload.order_index.toString());

        optionGroupPayload.options.forEach((option, index) => {
          groupFormData.append(`options[${index}][id]`, option.id);
          groupFormData.append(`options[${index}][title]`, option.title);
          groupFormData.append(`options[${index}][price_adjustment]`, option.price_adjustment.toString());
          groupFormData.append(`options[${index}][order_index]`, option.order_index.toString());

          if (option.id.toString() === optionItemId.toString()) {
            groupFormData.append(`options[${index}][images]`, formData.get('image'));
          }
        });

        return await this.makeFormDataRequest(`option/update/${optionGroupData.id}`, groupFormData);
      } else {
        return await this.makeRequest(`option/update/${optionGroupData.id}`, {
          method: 'POST',
          body: JSON.stringify(optionGroupPayload),
        });
      }

    } catch (error) {
      console.error('Error updating option item:', error);
      throw error;
    }
  }

  transformToApiFormat(optionGroupData) {
    if (!optionGroupData.name || !optionGroupData.name.trim()) {
      throw new Error('Option group name is required');
    }

    const payload = {
      id: optionGroupData.id || null,
      title: optionGroupData.name.trim(),
      min_quantity: optionGroupData.minSelection || 0,
      max_quantity: optionGroupData.maxSelection || 1,
      is_required: optionGroupData.isOptional ? "0" : "1",
      status: 'active',
      order_index: optionGroupData.orderIndex || 0,
    };


    if (Array.isArray(optionGroupData.options) && optionGroupData.options.length > 0) {
      payload.options = optionGroupData.options.map((opt, idx) => {
        // Check if this is a menu item (has menu item properties)
        if (opt.id) {
          return {
            // Reference to existing menu item
            id: opt.id,
            title: opt.name || opt.title || '',
            price_adjustment: parseFloat(opt.price || opt.price_adjustment || 0),
            order_index: opt.order_index || idx + 1
          };
        } else {
          // This is a custom option (not a menu item)
          const option = {
            title: opt.name || opt.title || '',
            price_adjustment: parseFloat(opt.price || opt.price_adjustment || 0),
            order_index: opt.order_index || idx + 1
          };

          // Include ID only if it exists (for updates)
          if (opt.id) {
            option.id = opt.id;
          }

          return option;
        }
      });
    }

    console.log('Transformed payload:', payload);
    return payload;
  }

  transformFromApiFormat(apiData) {
    if (Array.isArray(apiData)) {
      return apiData.map(item => this.transformSingleItem(item));
    }
    return this.transformSingleItem(apiData);
  }

  transformSingleItem(item) {
    return {
      id: item.id,
      name: item.title || '',
      optionCount: item.options ? item.options.length : 0,
      minSelection: parseInt(item.min_quantity) || 0,
      maxSelection: parseInt(item.max_quantity) || 1,
      associatedItems: 0,
      isSelected: false,
      isOptional: item.is_required === "0" || item.is_required === 0,
      status: item.status || 'active',
      orderIndex: parseInt(item.order_index) || 0,
      options: (item.options || []).map((option, idx) => ({
        id: option.id,
        name: option.title || '',
        price: parseFloat(option.price_adjustment) || 0,
        title: option.title || '',
        price_adjustment: parseFloat(option.price_adjustment) || 0,
        order_index: parseInt(option.order_index) || idx + 1,
        optionGroupItemId: option.option_group_item_id,
        images: option.images || null,
        images_compressed: option.images_compressed || null,
        imagePreview: option.images_compressed || option.images || null,
        isExisting: true
      }))
    };
  }

  async bulkDeleteOptionGroups(ids) {
    const deletePromises = ids.map(id => this.deleteOptionGroup(id));
    return await Promise.allSettled(deletePromises);
  }

  filterOptionGroups(optionGroups, searchQuery) {
    if (!searchQuery) return optionGroups;

    return optionGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  async reorderOptionGroups(reorderedGroups) {
    const updatePromises = reorderedGroups.map((group, index) =>
      this.updateOptionGroup(group.id, { ...group, orderIndex: index })
    );
    return await Promise.allSettled(updatePromises);
  }
}

const optionGroupService = new OptionGroupService();
export default optionGroupService;