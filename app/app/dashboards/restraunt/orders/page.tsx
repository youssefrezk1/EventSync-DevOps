"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  Package,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  ChefHat,
  Eye,
  EyeOff,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  User,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock3,
  ShoppingBag,
} from "lucide-react";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { api } from "@/api";
import BasicLayout from "@/components/layouts/basicLayout2";
import Receipt from "@/shared/components/Recipt";
const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/restraunt" },
  { text: "Menu", icon: <MenuBookIcon />, href: "/dashboards/restraunt/menu" },
  { text: "Orders", icon: <ReceiptLongIcon />, href: "/dashboards/restraunt/orders" },
];
const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const Toast = ({ toasts, removeToast }) => {
  return (
    <div aria-live="polite" className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`max-w-sm w-full flex items-start gap-3 p-3 rounded-xl shadow-xl border ${t.type === "error" ? "bg-red-50 border-red-200" : "bg-white border-gray-100"
            }`}
        >
          {t.type === "error" ? (
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          ) : (
            <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
          )}
          <div className="text-sm text-gray-700">{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-4">
    <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded w-4/6" />
    </div>
  </div>
);

const useFocusTrap = (open) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0] as HTMLElement | undefined;
    const last = focusable[focusable.length - 1] as HTMLElement | undefined;
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => first?.focus?.(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return containerRef;
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [modalViewMode, setModalViewMode] = useState("receipt");

  const modalRef = useFocusTrap(isDialogOpen);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const pushToast = (message, type = "success", ttl = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type }]);
    if (ttl > 0) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  };

  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const deb = debounce(() => {
      filterOrders();
    }, 220);
    deb();
  }, [searchQuery, statusFilter, orders]);

  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter && statusFilter !== "All Orders") {
      // Use case-insensitive comparison
      filtered = filtered.filter((order) => 
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order._id?.toLowerCase().includes(q) ||
          order.buyerName?.toLowerCase().includes(q) ||
          order.Student?.Name?.toLowerCase().includes(q) ||
          order.Staff?.Name?.toLowerCase().includes(q)
      );
    }

    setFilteredOrders(filtered);
  };

  const fetchOrders = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await api.get("/restraunt/orders");
      const ordersData = Array.isArray(res.data?.orders) ? res.data.orders :
        Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch orders");
      pushToast("Failed to fetch orders", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);

      if (newStatus.toLowerCase() === "completed") {
        await api.patch(`/restraunt/order/${orderId}/complete`);
      } else if (newStatus.toLowerCase() === "confirmed") {
        await api.patch(`/restraunt/order/${orderId}/confirm`);
      }

      pushToast(`Order status updated to ${newStatus}`);
      await fetchOrders();
    } catch (err: any) {
      console.error(err);
      pushToast("Failed to update order status", "error");
    } finally {
      setLoading(false);
      setActionMenuOpen(null);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const clearFilters = () => {
    setStatusFilter("All Orders");
    setSearchQuery("");
  };

  const statusOptions = ["All Orders", "Confirmed", "Completed"];

  return (
    <BasicLayout menuItems={menuItems}>
      <div className="min-h-screen bg-gray-50">
        <Toast toasts={toasts} removeToast={removeToast} />

        {/* Hero Section */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden shadow-lg"
          style={{
            backgroundImage: `
            linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65)),
            url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0')
          `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "380px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30"></div>

          <div className="relative z-10 px-6 py-10 h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-black/30 backdrop-blur-sm rounded-xl shadow">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white drop-shadow">
                  Orders Management
                </h1>
                <p className="text-white/90 text-base max-w-xl mt-1">
                  Track, manage, and fulfill customer orders in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => fetchOrders()}
                disabled={fetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white 
                         border border-white/40 rounded-lg hover:bg-white/10 
                         transition-all backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Filters Sidebar */}
         <div className="w-80 flex-shrink-0">
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6 h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#003d52] hover:text-[#021920]"
                >
                  Clear All
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Status</h3>
                <div className="space-y-1">
                  {statusOptions.map((status) => {
                    const count = status === "All Orders"
                      ? orders.length
                      : orders.filter(o => o.status === status).length;

                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${statusFilter === status
                          ? "bg-[#003d52]/10 text-[#003d52] font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          {statusFilter === status && (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusFilter === status
                          ? "bg-[#003d52]/20 text-[#021920]"
                          : "bg-gray-100 text-gray-600"
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and View Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 relative max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders by ID, customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52] text-sm"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                  </div>

                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Grid/List */}
            {fetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No orders found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-[#003d52] text-white rounded-lg hover:bg-[#021920] transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <Receipt
                    key={order._id}
                    order={order}
                    onComplete={async () => {
                      await handleStatusUpdate(order._id, "completed");
                    }}
                    showCompleteButton={order.status !== "Completed"}
                    loading={loading}
                    compact={true}
                  />
                ))}
              </div>

            ) : (
              // List View
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            #{order._id?.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.buyerName || order.Student?.Name || order.Staff?.Name || "Guest"}
                            </div>
                            {order.phone && (
                              <div className="text-sm text-gray-500">{order.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {order.items?.length || 0} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            ${(order.total || order.price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="text-[#003d52] hover:text-[#021920] mr-3"
                            >
                              View
                            </button>
                            {order.status.toLowerCase() !== "completed" && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, "completed")}
                                className="text-green-600 hover:text-green-900"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
            }
          </div>
        </div>

        {/* Order Details Modal */}
        {
          isDialogOpen && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div ref={modalRef} className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between z-10">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder._id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setModalViewMode("receipt")}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${modalViewMode === "receipt"
                          ? "bg-[#003d52] text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        Receipt
                      </button>
                      <button
                        onClick={() => setModalViewMode("details")}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${modalViewMode === "details"
                          ? "bg-[#003d52] text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        Details
                      </button>
                    </div>
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      aria-label="Close"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {modalViewMode === "receipt" ? (
                  <div className="p-6">
                    <Receipt
                      order={selectedOrder}
                      onComplete={async () => {
                        await handleStatusUpdate(selectedOrder._id, "completed");
                        setIsDialogOpen(false);
                      }}
                      showCompleteButton={selectedOrder.status !== "Completed"}
                      loading={loading}
                      compact={true}
                    />
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Customer</div>
                        <div className="font-medium text-gray-900">
                          {selectedOrder.buyerName || selectedOrder.Student?.Name || selectedOrder.Staff?.Name || "Guest"}
                        </div>
                        {selectedOrder.phone && (
                          <div className="text-sm text-gray-600 mt-1">{selectedOrder.phone}</div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Order Status</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${(selectedOrder.total || selectedOrder.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-4">
                              {item.foodItem?.Photo?.[0]?.url ? (
                                <img
                                  src={item.foodItem.Photo[0].url}
                                  alt={item.foodItem.name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{item.foodItem?.name || "Unknown Item"}</div>
                                <div className="text-sm text-gray-500">Quantity: {item.quantity || 1}</div>
                                {item.foodItem?.Price && (
                                  <div className="text-sm text-gray-500">
                                    Price: ${item.foodItem.Price.toFixed(2)} each
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              ${((item.foodItem?.Price || 0) * (item.quantity || 1)).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order ID:</span>
                            <span className="font-medium">{selectedOrder._id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Date:</span>
                            <span className="font-medium">
                              {new Date(selectedOrder.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium capitalize">{selectedOrder.paymentMethod || "Unknown"}</span>
                          </div>
                          {selectedOrder.pickupLocation && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pickup Location:</span>
                              <span className="font-medium">{selectedOrder.pickupLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">
                              ${selectedOrder.items?.reduce((sum, item) =>
                                sum + ((item.foodItem?.Price || 0) * (item.quantity || 1)), 0
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Fee:</span>
                            <span className="font-medium">
                              ${((selectedOrder.total || selectedOrder.price || 0) * 0.08).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-3">
                            <span className="text-gray-900 font-semibold">Total:</span>
                            <span className="text-lg font-bold text-gray-900">
                              ${(selectedOrder.total || selectedOrder.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 bg-white border-t p-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    {selectedOrder.status !== "completed" && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder._id, "completed");
                          setIsDialogOpen(false);
                        }}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-[#003d52] text-white font-medium rounded-lg hover:bg-[#021920] disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          "Mark as Completed"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </BasicLayout>
  );
}