import React, { useState, useEffect, useRef, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Eye, X, Loader, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../store/api/orderService';
import { apiUrl } from '@/constant/constants';


const OutletDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const lastOrderIds = useRef([]);
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalOrders: 0
  });
  const [newOrders, setNewOrders] = useState([]);
  const [showNewOrders, setShowNewOrders] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('Today');
  const [tabCounts, setTabCounts] = useState({
    'Today': 0,
    'Pending': 0,
    'Completed': 0
  });
  const userData = useMemo(() => {
        try {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }, []);
    
      const user_id = userData?.user?.user_id || null;
  
  
  const tabs = ['Pre Order','Today', 'Pending', 'On the Way', 'Ready to Pick Up', 'Picked Up', 'Completed'];
  const navigate = useNavigate();

 const statusMapping = {

  'Today': null,
  'Pre Order': null,
  'Pending': 'pending',
  'Ready to Pick Up': 'ready_to_pickup',
  'On the Way': 'on_the_way',
  'Picked Up': 'picked_up',
  'Completed': ['completed', 'delivered'],
};

  // Check if date is today
  const isToday = (dateString) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  // Load initial data
  useEffect(() => {
    if(user_id){
      loadOrders();
    loadSummaryData();
    }
    
  }, [activeTab],[user_id]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshDataInBackground();
    }, 3000); // 5 second auto-refresh

    return () => clearInterval(interval); 
  }, [activeTab]);

  const playNotificationSound = () => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.loop = true; // Ensure looping is enabled
    audioRef.current.play().catch(err => console.error("Sound play error:", err));
    setIsPlaying(true);
  }
};

  const stopNotificationSound = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0; // Reset to start
    audioRef.current.loop = false; // Disable looping
    setIsPlaying(false);
  }
};

  const refreshDataInBackground = async () => {
  try {
    const allOrders = await orderService.getCustomerOrderList(user_id);

    const statusFilter = statusMapping[activeTab];
    let filteredOrders = allOrders.filter(order => {
      if (activeTab === 'Today') {
        return isToday(order.created_at);
      } else if (activeTab === 'Pre Order') {
        // Check if selected_date is in the future
        const orderDate = new Date(`${order.selected_date} ${order.selected_time}`);
        return orderDate > new Date();
      } else if (Array.isArray(statusFilter)) {
        return statusFilter.includes(order.status);
      }
      return order.status === statusFilter;
    });

    const transformed = filteredOrders.map((order) => ({
      id: order.id,
      orderDate: order.created_at,
      orderType: order.order_type,
      status: order.status,
      selected_date: order.selected_date,
      selected_time: order.selected_time,
      paymentStatus: order.payment_status,
      subtotalAmount: `RM${order.subtotal_amount}`,
      discountAmount: `RM${order.discount_amount}`,
      taxAmount: `RM${order.tax_amount}`,
      deliveryFee: `RM${order.delivery_fee}`,
      grandTotal: `RM${order.grand_total}`,
      notes: order.notes || '-',
      trackingLink: order.deliveries?.[0]?.tracking_link || null,
    }));

    // Detect new orders
    const currentIds = transformed.map(o => o.id);
    const newOrderIds = currentIds.filter(id => !lastOrderIds.current.includes(id));

    if (newOrderIds.length > 0 && lastOrderIds.current.length > 0) {
      const newOrdersList = transformed.filter(order => newOrderIds.includes(order.id));

      // Merge with existing without duplicates
      setNewOrders(prevOrders => {
        const merged = [...prevOrders, ...newOrdersList];
        return merged.filter(
          (order, index, self) => 
            index === self.findIndex(o => o.id === order.id)
        );
      });

      setShowNewOrders(true);
      setNotificationMessage(`${newOrderIds.length} new order(s) received!`);
      playNotificationSound();

      setTimeout(() => {
        setNotificationMessage('');
      }, 5000);
    }

    setData(transformed);
    setFilteredData(transformed);
    setPagination(prev => ({
      ...prev,
      total: transformed.length
    }));

    updateTabCounts(allOrders);
    lastOrderIds.current = currentIds;
    setError(null);
  } catch (err) {
    console.error('Auto-refresh failed:', err);
  }
};

  const loadOrders = async () => {
    setError(null);
    try {
      const allOrders = await orderService.getCustomerOrderList(user_id);
      
      const statusFilter = statusMapping[activeTab];
    let filteredOrders = allOrders.filter(order => {
      if (activeTab === 'Today') {
        return isToday(order.created_at);
      } else if (activeTab === 'Pre Order') {
        const orderDate = new Date(`${order.selected_date} ${order.selected_time}`);
        return orderDate > new Date();
      } else if (Array.isArray(statusFilter)) {
        return statusFilter.includes(order.status);
      }
      return order.status === statusFilter;
    });

      const transformed = filteredOrders.map((order) => ({
        id: order.id,
        orderDate: order.created_at,
        orderType: order.order_type,
        status: order.status,
        selected_date: order.selected_date,
        selected_time: order.selected_time,
        paymentStatus: order.payment_status,
        subtotalAmount: `RM${order.subtotal_amount}`,
        discountAmount: `RM${order.discount_amount}`,
        taxAmount: `RM${order.tax_amount}`,
        deliveryFee: `RM${order.delivery_fee}`,
        grandTotal: `RM${order.grand_total}`,
        notes: order.notes || '-',
      }));

      setData(transformed);
      setFilteredData(transformed);
      setPagination({
        ...pagination,
        total: transformed.length
      });

      updateTabCounts(allOrders);
      lastOrderIds.current = transformed.map(o => o.id);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    }
  };

  const updateTabCounts = (orders) => {
  const counts = {
    'Today': orders.filter(order => isToday(order.created_at)).length,
    'Pre Order': orders.filter(order => {
      const orderDate = new Date(`${order.selected_date} ${order.selected_time}`);
      return orderDate > new Date();
    }).length,
    'Pending': orders.filter(o => o.status === 'pending').length,
    'Ready to Pick Up': orders.filter(o => o.status === 'ready_to_pickup').length,
    'On the Way': orders.filter(o => o.status === 'on_the_way').length,
    'Picked Up': orders.filter(o => o.status === 'picked_up').length,
    'Completed': orders.filter(o => ['completed', 'delivered'].includes(o.status)).length,
  };
  setTabCounts(counts);
};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const loadSummaryData = async () => {
    try {
      const orders = await orderService.getCustomerOrderList(user_id);
      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.grand_total), 0);
      const totalOrders = orders.length;
      
      setSummaryData({
        totalSales,
        totalOrders
      });
    } catch (err) {
      console.error('Failed to load summary data:', err);
    }
  };

  const columns = [
    {
      name: 'Actions',
      center:true,
      cell: row => (
        <div className="flex space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => navigate(`/orders/order_lists/order_overview/${row.id}`)}
            title="View Details"
          >
            <Eye size={16} className="text-gray-600" />
          </button>
        </div>
      ),
      width: '100px'
    },
    {
      name: 'Tracking Link',
      cell: row => {
        // Convert to lowercase for case-insensitive comparison
        const isDelivery = row.orderType.toLowerCase() === 'delivery';
        
        if (!isDelivery) {
          return ""; // Empty string for non-delivery orders
        }
        
        // For delivery orders
        return row.trackingLink ? (
          <a 
            href={row.trackingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon size={16} className="text-blue-500 hover:text-blue-700" />
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
      width: '120px',
      ignoreRowClick: true,
      center: true
    },
    {
      name: 'Order Type',
      selector: row => row.orderType,
      sortable: true,
      width: '140px',
      cell: row => {
        const isNewOrder = newOrders.some(newOrder => newOrder.id === row.id);

        // Clean up orderType: remove - and _, replace with space, capitalize words
        let cleanOrderType = row.orderType
          ? row.orderType.replace(/[-_]/g, ' ').trim()
          : '';

        cleanOrderType = cleanOrderType
          .toLowerCase()
          .replace(/\b\w/g, char => char.toUpperCase());

        return (
          <div className="relative">
            {cleanOrderType || <span className="text-gray-400">N/A</span>}
            {isNewOrder && (
              <span className="absolute -top-2 -right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      name: 'Order Date',
      selector: row => new Date(row.orderDate).toLocaleString(),
      sortable: true,
      width: '185px'
    },
    {
      name: 'Pickup/Delivery Time',
      selector: row => `${row.selected_date} ${row.selected_time}`,
      sortable: true,
      width: '200px',
      cell: row => {
        // Combine date and time into a single datetime string
        const dateTimeStr = `${row.selected_date} ${row.selected_time}`;
        
        // Parse the datetime string into a Date object
        const orderDateTime = new Date(dateTimeStr);
        const now = new Date();
        
        // Check if the order datetime is in the future
        const isFuture = orderDateTime > now;
        
        return (
          <div className={`${isFuture ? 'font-semibold text-blue-600' : ''}`}>
            {row.selected_date} {row.selected_time}
            {isFuture && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Future
              </span>
            )}
          </div>
        );
      }
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '120px',
      cell: row => {
        // Convert status to lowercase for case-insensitive comparison
        const status = row.status.toLowerCase();
        
        // Determine styling based on status
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        
        if (status === 'on_the_way') {
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
        } else if (status === 'picked_up') {
          bgColor = 'bg-purple-100';
          textColor = 'text-purple-800';
        } else if (status === 'completed' || status === 'delivered') {
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
        } else if (status === 'confirmed') {
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
        } else if (status === 'pending') {
          bgColor = 'bg-orange-100';
          textColor = 'text-orange-800';
        } else if (status === 'ready_to_pickup') {
          bgColor = 'bg-teal-100';
          textColor = 'text-teal-800';
        } else if (status === 'cancelled') {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
        }

        // Format the status text for display (convert underscores to spaces and capitalize)
        const formatStatus = (status) => {
          return status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
        };

        return (
          <span className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}>
            {formatStatus(row.status)}
          </span>
        );
      }
    },
    {
      name: 'Payment Status',
      selector: row => row.paymentStatus,
      sortable: true,
      width: '170px',
      center: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.paymentStatus}
        </span>
      )
    },
    {
      name: 'Total',
      selector: row => row.grandTotal,
      sortable: true,
      width: '105px',
      cell: row => <span className="font-semibold">{row.grandTotal}</span>
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: '#1A237E',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        padding: '16px',
        minHeight: '56px'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#1A237E',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderBottom: '1px solid #e5e7eb'
      }
    },
    headCells: {
      style: {
        color: '#ffffff',
        backgroundColor: '#1A237E',
        fontSize: '14px',
        fontWeight: '600',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#374151',
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
        paddingTop: '12px',
        paddingBottom: '12px'
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <audio ref={audioRef} src="https://uspizza.ipsgroup.com.my/cms/notification.mp3" preload="auto" allow="autoplay" loop={true}/>
      
      {/* Notification Toast */}
      {notificationMessage && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-4 py-2 rounded shadow-lg flex items-center">
            <span>{notificationMessage}</span>
            <button 
              onClick={() => setNotificationMessage('')} 
              className="ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Sound Control */}
      {isPlaying && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={stopNotificationSound}
            className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
          >
            Stop Alert
          </button>
        </div>
      )}

      {/* New Orders Table */}
      {showNewOrders && (
        <div className="mb-6 border border-yellow-300 rounded-lg shadow-lg bg-yellow-50">
          <div className="p-4 bg-yellow-200 flex justify-between items-center">
            <h3 className="font-bold text-yellow-800">
              New Orders Received {newOrders.length}
            </h3>
            <button 
              onClick={() => setShowNewOrders(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={newOrders}
              customStyles={{
                ...customStyles,
                header: { style: { backgroundColor: '#F59E0B', color: '#ffffff' } },
                headRow: { style: { backgroundColor: '#F59E0B', color: '#ffffff' } },
                headCells: { style: { backgroundColor: '#F59E0B', color: '#ffffff' } }
              }}
              noDataComponent={
                <div className="py-4 text-center text-gray-500">
                  No new orders to display
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                RM{summaryData.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            <span className={`${summaryData.totalSales > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryData.totalSales > 0 ? '+' : ''}{summaryData.totalOrders} orders
            </span> in total
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {summaryData.totalOrders}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            All orders in the system
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 items-center text-sm font-medium mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-1.5 rounded-full border-2 transition whitespace-nowrap ${
              activeTab === tab
                ? "bg-yellow-400 text-white border-yellow-400"
                : "border-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab} <span className="ml-1">{tabCounts[tab] || 0}</span>
          </button>
        ))}
      </div>

      {/* Main Orders Table */}
      <div className="w-full bg-white shadow-lg rounded-lg">
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <DataTable
        columns={columns}
        data={paginatedData}
        pagination
        paginationServer={true}
        paginationTotalRows={filteredData.length}
        paginationDefaultPage={currentPage}
        paginationPerPage={rowsPerPage}
        paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        progressComponent={
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }
        customStyles={customStyles}
        responsive
        striped
        highlightOnHover
        noDataComponent={
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-gray-500 text-lg mb-2">No orders found</div>
            <div className="text-gray-400 text-sm">Try adjusting your filters or search criteria</div>
          </div>
        }
      />
      </div>
    </div>
  );
};

export default OutletDashboard;