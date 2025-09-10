import { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { PenSquare, LayoutGrid, Trash, Plus, Download, ChevronDown, Search, X, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/ui/DeletePopUp';
import { VITE_API_BASE_URL } from '../../constant/config';
import { CSVLink } from 'react-csv';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserService from '../../store/api/userService';

const MemberPage = () => {
  const authToken = sessionStorage.getItem('token');
  const [customerData, setCustomerData] = useState([]);
  const [filteredCustomerData, setFilteredCustomerData] = useState([]);
  const [tierData, setTierData] = useState([]);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [referralFilter, setReferralFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

      // Check user is admin
      if (userData.role && userData.role.toLowerCase() === 'admin') {
        setIsAdmin(true);
        setHasCreatePermission(true);
        setHasUpdatePermission(true);
        setHasDeletePermission(true);
        return;
      }

      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          // Check Topup module permissions
          if (permissions.Member) {
            if (permissions.Member.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Member.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Member.delete === true) {
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

  const deleteItem = async (customerId) => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "customers/delete/" + customerId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      let data = response;

      if (!response.ok) {
        console.error("Error deleteing customer:", data);
        throw new Error('This customer cant be found in the database');
      }

      setShowDeleteModal(false);
      setSelectedMemberId(null);

      setTimeout(() => window.location.reload(), 3500);

    } catch (err) {
      console.error("Error deleteing customer:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  const fetchCustomerWalletHistory = async (customerId) => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}ccustomer-wallet/history/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const walletHistory = await response.json();
      return walletHistory.data;
    } catch (error) {
      console.error("Error fetching wallet history:", error);
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "customers", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerData = await response.json();
      setCustomerData(customerData.data);
      setFilteredCustomerData(customerData.data); // Initialize filtered data

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  const fetchTierData = async () => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "settings/membership-tiers", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const tierData = await response.json();
      setTierData(tierData.data);
    } catch (error) {
      console.error("Error fetching tier data:", error);
    }
  }

  useEffect(() => {
    console.log('token', authToken);
    fetchCustomers();
    fetchTierData();
    fetchUserPermissions();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [nameFilter, emailFilter, phoneFilter, tierFilter, referralFilter, customerData]);

  const applyFilters = () => {
    let filteredData = [...customerData];

    if (nameFilter) {
      filteredData = filteredData.filter(customer => 
        customer.name && customer.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (emailFilter) {
      filteredData = filteredData.filter(customer => 
        customer.email && customer.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    if (phoneFilter) {
      filteredData = filteredData.filter(customer => 
        customer.phone && customer.phone.includes(phoneFilter)
      );
    }

    if (tierFilter) {
      filteredData = filteredData.filter(customer => 
        customer.customer_tier && customer.customer_tier.toLowerCase() === tierFilter.toLowerCase()
      );
    }

    if (referralFilter) {
      filteredData = filteredData.filter(customer => 
        customer.customer_referral_code && 
        customer.customer_referral_code.toLowerCase().includes(referralFilter.toLowerCase())
      );
    }

    setFilteredCustomerData(filteredData);
  };

  const clearFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    setTierFilter('');
    setReferralFilter('');
  };

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tierColorClasses = {
    gold: "text-yellow-600 font-medium",
    silver: "text-gray-500 font-medium",
    bronze: "text-amber-700 font-medium",
    platinum: "text-purple-600 font-medium",
  };

  const getTierColor = (tier) => {
    const key = tier?.toLowerCase();
    return key ? tierColorClasses[key] : "";
  };

  function getTierName(tierIdStr) {
    const normalizedId = String(tierIdStr).trim();
    const tier = tierData.find(t => String(t.id).trim() === normalizedId);
    return tier ? tier.name : null;
  }

  const csvData = [
    ['Name', 'Email', 'Phone', 'Membership Tier', 'Total Transaction (RM)', 'Last Transaction Date', 'Wallet Value', 'Unclaimed Vouchers', 'Subscription', 'Date Joined', 'Referral'],
    ...filteredCustomerData.map(c => [c.name, c.email, c.phone, c.customer_tier, c.totalTransaction, c.lastTransactionDate, c.customer_wallet, c.unclaimedVouchers, c.subscription, c.created_at, c.customer_referral_code])
  ];

  const handleAddMember = () => {
    navigate('/member/add_new_member/');
  };

  const handleEditMember = (id) => {
    navigate(`/member/member_overview/${id}`);
  }

  const handleOrgChart = () => {
    navigate('/member/org_chart');
  }

  const handleDeleteClick = (id) => {
    setSelectedMemberId(id);
    setShowDeleteModal(true);
  };

  const ActionButtons = ({ row }) => {
    return (
      <div className="flex items-center gap-4 justify-end pr-2">
        {(isAdmin || hasUpdatePermission) && (
          <button
            type="button"
            data-tag="allowRowEvents"
            className="p-2 border rounded-md hover:bg-gray-100"
            onClick={() => handleEditMember(row.id)}
            title="Edit Member"
          >
            <PenSquare size={18} className="text-gray-600" />
          </button>
        )}

        <button
          className="p-2 border rounded-md hover:bg-gray-100"
          onClick={handleOrgChart}
          title="View Org Chart"
        >
          <LayoutGrid size={18} className="text-gray-600" />
        </button>
        
        {(isAdmin || hasDeletePermission) && (
          <button
            className="p-2 border rounded-md hover:bg-gray-100"
            onClick={() => handleDeleteClick(row.id)}
            title="Delete Member"
          >
            <Trash size={18} className="text-gray-600" />
          </button>
        )}
      </div>
    );
  };

  const columns = [
    {
      name: 'Action',
      cell: row => <ActionButtons row={row} />,
      button: true,
      width: '180px',
      right: true,
    },
    {
      name: 'Name',
      selector: row => row.name || '-',
      minWidth: '200px',
      wrap: true,
    },
    {
      name: 'Phone Number',
      selector: row => row.phone || '-',
      minWidth: '180px',
    },
    {
      name: 'Email Address',
      selector: row => row.email || '-',
      minWidth: '280px',
    },
    {
      name: 'Membership Tier',
      selector: row => row.customer_tier_id,
      cell: row => row.customer_tier ? (
        <span className={getTierColor(row.customer_tier)}>{row.customer_tier}</span>
      ) : '-',
      minWidth: '180px',
    },
    {
      name: 'Wallet Value',
      selector: row => row.customer_wallet ? `RM ${row.customer_wallet}` : 'RM0.00',
      minWidth: '150px',
    },
    {
      name: 'Date Joined',
      selector: row => row.created_at || '-',
      minWidth: '200px',
    },
    {
      name: 'Referral',
      selector: row => row.customer_referral_code ? row.customer_referral_code : '-',
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

  return (
    <div>
      <ToastContainer />

      <div>
        <h1 className="text-xl font-medium text-gray-600 mb-6 ml-3">Members</h1>
        <div className="bg-white shadow-sm overflow-hidden rounded-lg">
          <div className="px-6 py-8 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-800">Member</h2>
            <div className="flex gap-3">
              {(isAdmin || hasCreatePermission) && (
                <button className="bg-[#312e81] text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium" onClick={handleAddMember}>
                  <Plus size={20} />
                  Add New Member
                </button>
              )}
              <CSVLink data={csvData} filename="customers.csv">
                <button className="bg-[#312e81] text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <Download size={20} />
                  Export CSV
                </button>
              </CSVLink>
              <button 
                className="bg-[#312e81] text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Filter by name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    placeholder="Filter by email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    placeholder="Filter by phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Tiers</option>
                    {tierData.map(tier => (
                      <option key={tier.id} value={tier.name}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                  <input
                    type="text"
                    value={referralFilter}
                    onChange={(e) => setReferralFilter(e.target.value)}
                    placeholder="Filter by referral code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                >
                  <X size={16} className="mr-1" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <DataTable
            className='py-3'
            columns={columns}
            data={filteredCustomerData}
            pagination
            persistTableHead
            customStyles={customStyles}
            sortIcon={<ChevronDown size={16} />}
            responsive
          />
        </div>

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteItem(selectedMemberId);
            setShowDeleteModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default MemberPage;