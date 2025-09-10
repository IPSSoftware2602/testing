import React, { useState, useEffect } from 'react';
import { ChevronDown, Edit, Trash2 } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '@/components/ui/DeletePopUp';
import { toast } from 'react-toastify';
import UserService from '../../../store/api/userService';
import { VITE_API_BASE_URL } from '../../../constant/config';

const DiscountList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      
      const userObj = JSON.parse(userStr);
      const userId = userObj?.user.user_id;
      if (!userId) return;

      const userDataRes = await UserService.getUser(userId);
      const userData = userDataRes?.data;
      if (!userData) return;

      // Check if user is admin
      if (userData.role && userData.role.toLowerCase() === 'admin') {
        setIsAdmin(true);
        setHasCreatePermission(true);
        setHasUpdatePermission(true);
        setHasDeletePermission(true);
        return;
      }

      // Parse and set permissions for non-admin users
      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          if (permissions.Promo && permissions.Promo.subItems && permissions.Promo.subItems["Discount List"]) {
            if (permissions.Promo.subItems["Discount List"].create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Promo.subItems["Discount List"].update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Promo.subItems["Discount List"].delete === true) {
              setHasDeletePermission(true);
            }
          }

        } catch (e) {
          console.error("Error parsing user permissions:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchUserPermissions();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const userData = localStorage.getItem('user');
      let token = '';
      
      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          token = userObj.token || userObj.access_token || '';
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
      
      const response = await fetch(`${VITE_API_BASE_URL}store-discount/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to access discounts.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setDiscounts(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch discounts');
      }
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError(err.message || 'Failed to load discounts');
      
      // Show error toast notification
      toast.error(err.message || 'Failed to load discounts', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
  if (itemToDelete) {
    try {
      // Get token from localStorage
      const userData = localStorage.getItem('user');
      let token = '';
      
      if (userData) {
        try {
          const userObj = JSON.parse(userData);
          token = userObj.token || userObj.access_token || '';
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
      
      const response = await fetch(`${VITE_API_BASE_URL}store-discount/delete/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete discount');
      }

      if (data.status === 'success') {
        setDiscounts(discounts.filter(discount => discount.id !== itemToDelete.id));
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        throw new Error(data.message || 'Failed to delete discount');
      }
    } catch (err) {
      console.error('Error deleting discount:', err);
      toast.error(err.message || 'Failed to delete discount', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  }
};

  const addDiscount = () => {
    navigate("/promo/discount/add_new_discount");
  };

  const editDiscount = (id) => {
    navigate(`/promo/discount/update_discount/${id}`);
  };
  

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    {
      name: 'Action',
      width: '120px',
      cell: row => (
        <div className="flex gap-3 justify-center">
          {(isAdmin || hasUpdatePermission) && (
            <button 
              onClick={() => editDiscount(row.id)}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          )}
         {(isAdmin || hasDeletePermission) && ( 
            <button 
              onClick={() => {
                setItemToDelete(row);
                setShowDeleteModal(true);
              }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
           )} 
        </div>
      )
    },
    {
      name: 'Discount Name',
      selector: row => row.discount_name,
      sortable: true,
      width: '200px'
    },
    {
      name: 'Type',
      selector: row => row.discount_type,
      sortable: true,
      width: '120px',
      cell: row => (
        <span className="capitalize">{row.discount_type}</span>
      )
    },
    {
      name: 'Value',
      selector: row => row.discount_value,
      sortable: true,
      width: '120px',
      cell: row => (
        <span>
          {row.discount_type === 'percentage' 
            ? `${row.discount_value}%` 
            : row.discount_value}
        </span>
      )
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '120px',
      cell: row => {
        const isActive = row.status === 'active';
        let statusClass = 'bg-green-100 text-green-800';
        let statusText = row.status.charAt(0).toUpperCase() + row.status.slice(1);

        if (!isActive) {
          statusClass = 'bg-gray-100 text-gray-800';
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        );
      }
    },
    {
      name: 'Created At',
      selector: row => row.created_at,
      sortable: true,
      width: '150px',
      cell: row => (
        <span>{formatDate(row.created_at)}</span>
      )
    },
    {
      name: 'Tier IDs',
      selector: row => row.tier_id_list,
      sortable: true,
      width: '120px',
      center: true
    },
    {
      name: 'Outlet Count',
      selector: row => row.outlet_list,
      sortable: true,
      width: '150px',
      center: true,
      cell: row => (
        <span>{row.outlet_list ? row.outlet_list.split(',').length : 0}</span>
      )
    },
    {
      name: 'Menu Item Count',
      selector: row => row.menu_item_list,
      sortable: true,
      width: '170px',
      center: true,
      cell: row => (
        <span>{row.menu_item_list ? row.menu_item_list.split(',').length : 0}</span>
      )
    },
  ];

  const customStyles = {
    table: {
      style: {
        width: '100%'
      }
    },
    header: {
      style: {
        backgroundColor: '#1A237E',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600',
        padding: '16px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#1A237E',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        minHeight: '52px'
      }
    },
    headCells: {
      style: {
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#374151',
        minHeight: '60px',
        '&:nth-of-type(odd)': {
          backgroundColor: '#f9fafb'
        },
        '&:hover': {
          backgroundColor: '#f3f4f6'
        }
      }
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '14px',
        paddingBottom: '14px'
      }
    },
    pagination: {
      style: {
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '16px',
        borderRadius: "0 0 8px 8px"
      }
    }
  };

  const paginationComponentOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: true,
    selectAllRowsItemText: 'All'
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-center items-center p-8">
            <div className="text-gray-500">Loading discounts...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex flex-col justify-center items-center p-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchDiscounts}
              className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">
            Discount List
          </h2>
          <div className="flex gap-3">
            {(isAdmin || hasCreatePermission) && (
              <button 
                onClick={addDiscount}
                className="px-6 py-2.5 bg-indigo-900 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                + Add Discount
              </button>
             )} 
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={discounts}
            pagination
            paginationComponentOptions={paginationComponentOptions}
            customStyles={customStyles}
            striped
            highlightOnHover
            responsive
            noHeader
            paginationPerPage={5}
            paginationRowsPerPageOptions={[5, 10, 15, 20]}
            sortIcon={<ChevronDown size={16} />}
            dense={false}
            noDataComponent={
              <div className="p-8 text-center text-gray-500">
                No discounts found. Click "Add Discount" to create one.
              </div>
            }
          />
        </div>

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          itemName={itemToDelete?.discount_name || ''}
        />
      </div>
    </div>
  );
};

export default DiscountList;