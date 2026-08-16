"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, DollarSign, Users, Calendar, Store, CalendarDays, AlertCircle, TrendingUp, UserCheck, Bell, LogOut } from 'lucide-react';
import BasicLayout from "@/components/layouts/basicLayout2";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import BarChartIcon from "@mui/icons-material/BarChart";
import {LocalOffer} from "@mui/icons-material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AuthGuard from "@/components/AuthGuard";
import axios from "axios";

const menuItems = [
  { text: "Home", icon: <HomeIcon />, href: "/dashboards/admin" },
  { text: "Staff Verification", icon: <HomeIcon />, href: "/dashboards/admin/roles" },
  { text: "Vendor Requests", icon: <BusinessIcon />, href: "/dashboards/admin/vendorRequests" },
  { text: "Events", icon: <EventIcon />, href: "/dashboards/admin/events" },
  { text: "Admins", icon: <HomeIcon />, href: "/dashboards/admin/admins" },
  { text: "Event Office", icon: <WorkIcon />, href: "/dashboards/admin/eventoffice" },
  { text: "All Users", icon: <HomeIcon />, href: "/dashboards/admin/all-users" },
  { text: "All Vendors", icon: <BusinessIcon />, href: "/dashboards/admin/vendors" },
  { text: "Restaurants", icon: <RestaurantIcon />, href: "/dashboards/admin/restraunts" },
  { text: "Reports", icon: <BarChartIcon />, href: "/dashboards/admin/reports" },
  {text: "Loyalty Program",icon: <LocalOffer />,href: "/dashboards/admin/loyaltyProgram"},
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    pendingRequests: 0,
    totalRevenue: 0,
  });
  const [recentVendorRequests, setRecentVendorRequests] = useState<any[]>([]);
  const [recentStaffVerifications, setRecentStaffVerifications] = useState<any[]>([]);
  const [topRevenueEvents, setTopRevenueEvents] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Fetching dashboard data...");
  
      const token = localStorage.getItem("token");
      const authHeaders = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
  
      // Use Promise.allSettled to handle individual API failures gracefully
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/admin/all-users`),
        axios.get(`${API_URL}/api/vendorgetter`),
        axios.get(`${API_URL}/api/events`,authHeaders),
        axios.get(`${API_URL}/api/admin/participation-requests`, authHeaders),
        axios.get(`${API_URL}/admin/pendingStaff`),
        axios.get(`${API_URL}/admin/reports/revenue`, authHeaders),
      ]);
  
      console.log("API Results:", results);
  
      // Extract data with proper error handling for each endpoint
      const [
        usersResult,
        vendorsResult,
        eventsResult,
        vendorRequestsResult,
        staffResult,
        revenueResult
      ] = results;
  
      // Helper function to safely extract data
      const getData = (result, fallback = []) => {
        if (result.status === 'fulfilled') {
          const data = result.value.data;
          // Handle different response structures
          if (Array.isArray(data)) return data;
          if (data?.users) return data.users;
          if (data?.events) return data.events;
          if (data?.data) return data.data;
          if (data?.staff) return data.staff;
          if (data?.details) return data.details;
          return fallback;
        }
        console.warn('API call failed:', result.reason);
        return fallback;
      };
  
      // Extract data safely
      const users = getData(usersResult, []);
      const vendors = getData(vendorsResult, []);
      const events = getData(eventsResult, []);
      const vendorRequests = getData(vendorRequestsResult, []);
      const pendingStaff = getData(staffResult, []);
      const revenueDetails = getData(revenueResult, []);
      
      // Get total revenue safely
      const totalRevenue = revenueResult.status === 'fulfilled' 
        ? (revenueResult.value.data?.grandTotal || 0)
        : 0;
  
      console.log("Extracted Data:", {
        users: users.length,
        vendors: vendors.length,
        events: events.length,
        vendorRequests: vendorRequests.length,
        pendingStaff: pendingStaff.length,
        revenueDetails: revenueDetails.length,
        totalRevenue
      });
  
      // Calculate stats
      const totalUsers = Array.isArray(users) ? users.length : 0;
      const totalVendors = Array.isArray(vendors) ? vendors.length : 0;
      const totalEvents = Array.isArray(events) ? events.length : 0;
  
      // Count pending vendor requests - handle different field names
      const pendingVendorReqs = Array.isArray(vendorRequests)
        ? vendorRequests.filter((req) => 
            req.Pending === "Pending" || 
            req.status === "pending" ||
            req.approvalStatus === "pending"
          )
        : [];
      const pendingRequests = pendingVendorReqs.length;
  
      console.log("Calculated Stats:", {
        totalUsers,
        totalVendors,
        totalEvents,
        pendingRequests,
        totalRevenue,
      });
  
      // Get recent vendor requests (last 5 pending)
      const recentRequests = pendingVendorReqs
        .sort((a, b) => new Date(b.createdAt || b.dateCreated || 0).getTime() - new Date(a.createdAt || a.dateCreated || 0).getTime())
        .slice(0, 5)
        .map((req) => {
          // Handle different vendor object structures
          const vendor = req.VendorName || req.VendorID || req.vendor || {};
          const event = req.BazaarName || req.event || {};
          
          return {
            id: req._id || req.id || `req-${Math.random()}`,
            vendorName: vendor?.companyName || vendor?.name || "Unknown Vendor",
            vendorEmail: vendor?.email || "-",
            eventName: event?.name || event?.Name || "Booth Setup",
            type: req.BazaarName ? "Bazaar" : "Booth",
          };
        });
  
      // Get recent staff verifications (last 5)
      const recentStaff = pendingStaff.slice(0, 5).map((staff) => ({
        id: staff._id || staff.id || `staff-${Math.random()}`,
        name: staff.name || staff.fullName || (staff.firstName && staff.lastName 
          ? `${staff.firstName} ${staff.lastName}` 
          : staff.email?.split("@")[0] || "Unknown"),
        email: staff.email || "No email",
        role: staff.dummyrole || staff.role || "Pending",
      }));
  
      // Get top revenue events (top 5)
      const sortedEvents = revenueDetails
        .filter((e) => e.revenue > 0)
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 5)
        .map((event) => ({
          id: event.eventId || event.id || `event-${Math.random()}`,
          name: event.eventName || event.name || "Unnamed Event",
          revenue: event.revenue || 0,
          date: event.start || event.date || event.createdAt,
          attendees: event.count || event.attendees || 0,
        }));
  
      console.log("Processed Data:", {
        recentRequests,
        recentStaff,
        sortedEvents,
      });
  
      // Update state
      setStats({
        totalUsers,
        totalVendors,
        totalEvents,
        pendingRequests,
        totalRevenue,
      });
      setRecentVendorRequests(recentRequests);
      setRecentStaffVerifications(recentStaff);
      setTopRevenueEvents(sortedEvents);
  
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set fallback data to prevent UI breaking
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalEvents: 0,
        pendingRequests: 0,
        totalRevenue: 0,
      });
      setRecentVendorRequests([]);
      setRecentStaffVerifications([]);
      setTopRevenueEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const keyStatCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "#3b82f6", bgColor: "#eff6ff", href: "/dashboards/admin/all-users" },
    { title: "Total Vendors", value: stats.totalVendors, icon: Store, color: "#8b5cf6", bgColor: "#f5f3ff", href: "/dashboards/admin/vendors" },
    { title: "Total Events", value: stats.totalEvents, icon: CalendarDays, color: "#06b6d4", bgColor: "#ecfeff", href: "/dashboards/admin/events" },
    { title: "Pending Requests", value: stats.pendingRequests, icon: AlertCircle, color: "#f59e0b", bgColor: "#fffbeb", href: "/dashboards/admin/vendorRequests" },
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "#10b981", bgColor: "#ecfdf5", href: "/dashboards/admin/reports" },
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <BasicLayout menuItems={menuItems}>
        <div style={{ minHeight: "100vh" }}>
          {/* Hero Section */}
          <div style={{
            position: "relative",
            background: "linear-gradient(to bottom, rgba(0, 20, 40, 0.95), rgba(0, 61, 82, 0.85)), url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            marginBottom: "32px",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            <div style={{ 
              position: "relative", 
              zIndex: 1, 
              padding: "48px 32px 24px 32px", 
              width: "100%" 
            }}>
              <h1 style={{
                color: "white",
                fontWeight: 700,
                fontSize: "2.5rem",
                margin: "0 0 16px 0",
              }}>
                👋 Welcome to Admin Dashboard
              </h1>
              <p style={{
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "24px",
                maxWidth: "700px",
                fontSize: "1rem",
                lineHeight: 3.2,
              }}>
                Monitor platform activity, manage requests, and view key metrics all in one place.
              </p>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  color: "white",
                  backgroundColor: "transparent",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "white";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Top 5 Key Stats - Centered */}
          <div style={{ marginBottom: "40px", display: "flex", justifyContent: "center", padding: "0 32px" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
              gap: "24px", 
              maxWidth: "1000px", 
              width: "100%" 
            }}>
              {keyStatCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.title}
                    onClick={() => window.location.href = card.href}
                    style={{
                      cursor: "pointer",
                      borderRadius: "10px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.3s ease",
                      minHeight: "140px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "white",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
                      e.currentTarget.style.borderColor = card.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                      <div style={{
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: card.bgColor,
                        color: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <IconComponent size={32} />
                      </div>
                    </div>
                    <h2 style={{ 
                      fontWeight: 700, 
                      color: "#111827", 
                      marginBottom: "4px", 
                      fontSize: "1.75rem", 
                      margin: 0 
                    }}>
                      {card.value}
                    </h2>
                    <p style={{ 
                      color: "#6b7280", 
                      fontSize: "0.8rem", 
                      fontWeight: 500, 
                      margin: "4px 0 0 0" 
                    }}>
                      {card.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Three Equal Columns - Aligned with hero box */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", 
            gap: "24px",
            marginBottom: "32px"
          }}>
            
            {/* Recent Vendor Requests */}
            <div style={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    padding: "8px", 
                    borderRadius: "6px", 
                    backgroundColor: "#fffbeb", 
                    color: "#f59e0b", 
                    display: "flex" 
                  }}>
                    <AlertCircle size={22} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>Recent Vendor Requests</span>
                </div>
                <button 
                  onClick={() => window.location.href = "/dashboards/admin/vendorRequests"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}>
                  View All <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto" }}>
                {recentVendorRequests.length === 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    padding: "40px",
                    color: "#9ca3af"
                  }}>
                    <AlertCircle size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <p style={{ fontSize: "0.875rem", textAlign: "center" }}>No pending vendor requests</p>
                  </div>
                ) : (
                  recentVendorRequests.map((request, index) => (
                    <div
                      key={request.id}
                      onClick={() => window.location.href = "/dashboards/admin/vendorRequests"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "20px",
                        cursor: "pointer",
                        borderBottom: index < recentVendorRequests.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundColor: "#f3f4f6",
                          color: "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 600,
                        }}>
                          {request.vendorName[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                            {request.vendorName}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {request.vendorEmail}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: request.type === "Bazaar" ? "#fef3c7" : "#ede9fe",
                        color: request.type === "Bazaar" ? "#ca8a04" : "#7c3aed",
                      }}>
                        {request.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Staff Verifications */}
            <div style={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    padding: "8px", 
                    borderRadius: "6px", 
                    backgroundColor: "#fef2f2", 
                    color: "#ef4444", 
                    display: "flex" 
                  }}>
                    <UserCheck size={22} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>Recent Staff Verifications</span>
                </div>
                <button 
                  onClick={() => window.location.href = "/dashboards/admin/roles"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}>
                  View All <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto" }}>
                {recentStaffVerifications.length === 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    padding: "40px",
                    color: "#9ca3af"
                  }}>
                    <UserCheck size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <p style={{ fontSize: "0.875rem", textAlign: "center" }}>No pending staff verifications</p>
                  </div>
                ) : (
                  recentStaffVerifications.map((staff, index) => (
                    <div
                      key={staff.id}
                      onClick={() => window.location.href = "/dashboards/admin/roles"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "20px",
                        cursor: "pointer",
                        borderBottom: index < recentStaffVerifications.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundColor: "#93c7c1",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 600,
                        }}>
                          {staff.name[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                            {staff.name}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {staff.email}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: staff.role === "Professor" ? "#ede9fe" : staff.role === "TA" ? "#e0f2fe" : "#dcfce7",
                        color: staff.role === "Professor" ? "#7c3aed" : staff.role === "TA" ? "#0369a1" : "#15803d",
                      }}>
                        {staff.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Revenue Events */}
            <div style={{
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    padding: "8px", 
                    borderRadius: "6px", 
                    backgroundColor: "#ecfdf5", 
                    color: "#10b981", 
                    display: "flex" 
                  }}>
                    <TrendingUp size={22} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>Top Revenue Events</span>
                </div>
                <button 
                  onClick={() => window.location.href = "/dashboards/admin/reports"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}>
                  View Reports <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto" }}>
                {topRevenueEvents.length === 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    padding: "40px",
                    color: "#9ca3af"
                  }}>
                    <TrendingUp size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                    <p style={{ fontSize: "0.875rem", textAlign: "center" }}>No revenue events found</p>
                  </div>
                ) : (
                  topRevenueEvents.map((event, index) => (
                    <div
                      key={event.id}
                      onClick={() => window.location.href = "/dashboards/admin/reports"}
                      style={{
                        padding: "20px",
                        cursor: "pointer",
                        borderBottom: index < topRevenueEvents.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                          {event.name}
                        </span>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          backgroundColor: index === 0 ? "#fef3c7" : "#f3f4f6",
                          color: index === 0 ? "#ca8a04" : "#6b7280",
                        }}>
                          #{index + 1}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <DollarSign size={16} color="#10b981" />
                          <span style={{ fontWeight: 700, color: "#10b981", fontSize: "0.95rem" }}>
                            ${event.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Users size={14} color="#6b7280" />
                          <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                            {event.attendees}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={14} color="#6b7280" />
                          <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                            {new Date(event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </BasicLayout>
    </AuthGuard>
  );
}