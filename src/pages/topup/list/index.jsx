import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Download, Search, ChevronDown } from 'lucide-react';
import DataTable from 'react-data-table-component';
import DeleteConfirmationModal from '../../../components/ui/DeletePopUp';
import topupLists from '../../../store/api/topuplistsService';
import { VITE_API_BASE_URL } from "../../../constant/config";
import UserService from '../../../store/api/userService';

const TopUpPage = () => {
  const [topUpData, setTopUpData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const token = sessionStorage.getItem('token');
  const [userPermissions, setUserPermissions] = useState({});
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleExportCSV = () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Top Up Number",
      // "Customer ID",
      "Customer",
      "Payment Method",
      "Total Amount",
      "Status",
      "Top Up Date"
    ];

    const rows = filteredData.map(row => [
      row.topUpNumber,
      // row.customerId,
      row.name,
      row.phone,
      row.customer_wallet,
      row.paymentMethod,
      row.totalAmount,
      row.status,
      row.topUpDate
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(v => `"${v ?? ''}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `topup_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchCustomersData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();

      const customersArray = result?.data || [];
      setCustomersData(customersArray);
      return customersArray;
    } catch (error) {
      console.error("Error fetching customers data:", error);
      return [];
    }
  };

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

    if (userData.role && userData.role.toLowerCase() === 'admin') {
      setIsAdmin(true);
      setHasDeletePermission(true); 
      return;
    }

    let permissions = {};
    if (userData.user_permissions) {
      try {
        permissions = JSON.parse(userData.user_permissions);
        setUserPermissions(permissions);

        // Corrected path for Topup delete permission
        if (permissions.Topup && 
            permissions.Topup.subItems && 
            permissions.Topup.subItems.Lists && 
            permissions.Topup.subItems.Lists.delete === true) {
          setHasDeletePermission(true);
        }
      } catch (e) {
        console.error("Error parsing user permissions:", e);
      }
    }
  } catch (err) {
    console.error("Error fetching user permissions:", err);
  }
};

  const getCustomerNameById = (customerId, customers) => {
    const customer = customers.find(customer => customer.id === customerId.toString());
    return customer ? customer.name : '-';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await fetchUserPermissions();

        const [topupData, customers] = await Promise.all([
          topupLists.fetchTopupLists(),
          fetchCustomersData()
        ]);

        // console.log("Raw API data:", topupData);
        // console.log("Customers data:", customers);

        const formattedData = topupData.map(item => ({
          id: item.id,
          topUpNumber: item.topup_number || '-',
          topUpAmount: parseFloat(item.amount || 0).toFixed(2),
          topUpCredit: parseFloat(item.credit || 0).toFixed(2),
          paymentMethod: item.payment_method || '-',
          status: item.status || '-',
          createdDate: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : '-',
          customerId: item.customer_id || item.cus_id || '-',
          customer: getCustomerNameById(item.customer_id || item.cus_id, customers),
          name: item.name || '-',
          phone: item.phone || '-',
          customer_wallet: `RM ${parseFloat(item.customer_wallet || 0).toFixed(2)}`,
          totalAmount: `RM ${parseFloat(item.amount || 0).toFixed(2)}`,
          totalCredit: `RM ${parseFloat(item.credit || 0).toFixed(2)}`,
          otherAmount: `RM ${parseFloat(item.other_amount || 0).toFixed(2)}`,
          topUpDate: item.created_at
            ? new Date(item.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }).replace(',', '').toUpperCase()
            : '-'
        }));

        console.log("Formatted data:", formattedData);
        setTopUpData(formattedData);
      } catch (error) {
        console.error("Error loading topup data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await topupLists.deleteTopupSetting(itemToDelete);
      setTopUpData(prev => prev.filter(item => item.id !== itemToDelete));
    } catch (error) {
      console.error('Error deleting topup setting:', error);
    }
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const filteredData = useMemo(() => {
    let filtered = topUpData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.topUpNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter);
    }

    return filtered;
  }, [topUpData, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase().trim() || '';

    if (normalizedStatus === 'success' || normalizedStatus === 'paid' || normalizedStatus === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Success
        </span>
      );
    } else if (normalizedStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          -
        </span>
      );
    }
  };

  const columns = [
    {
      name: 'Action',
      width: '100px',
      cell: row => (
        (isAdmin || hasDeletePermission) && (
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="text-gray-600 hover:text-red-600 transition-colors p-1"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        )
      )
    },
    {
      name: 'Top Up Number',
      selector: row => row.topUpNumber,
      // sortable: true,
      width: '180px'
    },
    // {
    //   name: 'CusID',
    //   selector: row => row.customerId,
    //   sortable: true,
    //   width: '120px'
    // },
    {
      name: 'Customer Name',
      selector: row => row.name || '-',
      // sortable: true,
      center: true,
      width: '180px'
    },
    {
      name: 'Phone Number',
      selector: row => row.phone || '-',
      // sortable: true,
      center: true,
      width: '160px'
    },
    {
      name: 'Wallet Balance',
      selector: row => row.customer_wallet || '-',
      // sortable: true,
      center: true,
      width: '160px'
    },
    {
      name: 'Payment Method',
      selector: row => row.paymentMethod,
      width: '180px',
      center: true,
    },
    {
      name: 'Total Amount',
      selector: row => row.totalAmount,
      // sortable: true,
      width: '160px',
      cell: row => <span className="font-medium">{row.totalAmount}</span>
    },
    {
      name: 'Total Credit',
      selector: row => row.totalCredit,
      // sortable: true,
      width: '160px',
      cell: row => <span className="font-medium">{row.totalCredit}</span>
    },
    {
      name: 'Other Amount',
      selector: row => row.totalCredit,
      // sortable: true,
      width: '180px',
      cell: row => <span className="font-medium">{row.otherAmount}</span>
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '120px',
      center: true,
      cell: row => getStatusBadge(row.status)
    },
    {
      name: 'Top Up Date',
      selector: row => row.topUpDate,
      center: true,
      sortable: true,
      width: '260px'
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        minHeight: '50px',
        fontSize: '16px',
        justifyContent: 'center',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: '500',
        justifyContent: 'center',
        textAlign: 'center',
        subHeaderWrap: true,
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '15px',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        justifyContent: 'center',
        center: true,
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f9fafb',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        justifyContent: 'center',
        textAlign: 'center',
        alignItems: 'center',
        center: true,
      },
    },
    pagination: {
      style: {
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
    },
  };

  if (loading) {
    return (
      <div className="p-2">
        <div>
          <div className="mx-auto px-2 pb-6 sm:px-3lg:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-500">Top Up</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="text-center py-8 text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div>
          <div className="mx-auto px-2 pb-6 sm:px-3lg:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-500">Top Up</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="text-center py-8 text-red-500">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div>
        <div className="mx-auto px-2 pb-6 sm:px-3lg:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-500">Top Up</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Top Up Lists</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by number, customer, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="-">Unknown/Empty</option>
          </select>
          <button onClick={handleExportCSV} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
            <Download size={20} />
            Export CSV
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5, 10, 25, 50]}
          customStyles={customStyles}
          sortIcon={<ChevronDown size={16} />}
          responsive
          striped
          highlightOnHover
          noDataComponent={
            <div className="text-center py-8 text-gray-500">
              No records found
            </div>
          }
        />
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TopUpPage;