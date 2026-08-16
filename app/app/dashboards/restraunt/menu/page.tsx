"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  DollarSign,
  ImagePlus,
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
  Package,
} from "lucide-react";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BasicLayout from "@/components/layouts/basicLayout2";
import { api } from "@/api";
// Using the real backend API client instead of bundled dummy data
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
          className={`max-w-sm w-full flex items-start gap-3 p-3 rounded-xl shadow-xl border ${
            t.type === "error" ? "bg-red-50 border-red-200" : "bg-white border-gray-100"
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
  <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-0">
    <div className="h-40 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="h-8 bg-gray-100 rounded w-1/3" />
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

function PriceRangeControl({ items, filters, setFilters }) {
  const theme = useTheme();
  const prices = items.map((i) => Number(i.Price || 0));
  const maxItemPrice = prices.length ? Math.max(...prices) : 50;
  const maxLimit = Math.max(50, Math.ceil(maxItemPrice / 10) * 10);

  const min = filters.minPrice || 0;
  const max = filters.maxPrice || 0;

  const handleMinChange = (v) => {
    const val = Number(v) || 0;
    const newMin = Math.max(0, Math.min(val, max > 0 ? max : maxLimit));
    setFilters((p) => ({ ...p, minPrice: newMin }));
  };

  const handleMaxChange = (v) => {
    const val = Number(v) || 0;
    const newMax = Math.max(0, Math.min(val, maxLimit));
    setFilters((p) => ({ ...p, maxPrice: newMax }));
  };

  const filledPct = Math.round(((max > 0 ? max : maxLimit) / maxLimit) * 100);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={min}
          onChange={(e) => handleMinChange(e.target.value)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          aria-label="Min price"
        />
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={maxLimit}
            value={max > 0 ? max : maxLimit}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="w-full h-2 rounded-lg"
            style={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main} ${filledPct}%, #e5e7eb ${filledPct}%)`,
            }}
            aria-label="Max price"
          />
        </div>
        <input
          type="number"
          min={0}
          value={max}
          onChange={(e) => handleMaxChange(e.target.value)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          aria-label="Max price input"
        />
      </div>
      <div className="text-xs text-gray-500 mt-2">Showing items priced {min > 0 ? `>= $${min}` : "from any price"} {max > 0 ? `and <= $${max}` : "(no max)"}.</div>
    </div>
  );
}

// Categories will be derived from the restaurant's menu items

export default function MenuManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Items");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  
  const [filters, setFilters] = useState({
    availability: "all",
    // price filter as explicit min/max (0 means no bound)
    minPrice: 0,
    maxPrice: 0,
  });

  const [form, setForm] = useState({
    name: "",
    Price: 0,
    description: "",
    category: "",
    Availability: true,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const modalRef = useFocusTrap(isDialogOpen);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const mainContentRef = useRef(null);

  const pushToast = (message, type = "success", ttl = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type }]);
    if (ttl > 0) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuElement = actionMenuRef.current;
      if (menuElement && event.target instanceof Node && !menuElement.contains(event.target)) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleAdd();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const deb = debounce(() => {
      filterItems();
    }, 220);
    deb();
  }, [searchQuery, categoryFilter, items, filters]);

  const filterItems = () => {
    let filtered = [...items];

    // Category filter (categoryFilter holds category name or 'All Items')
    if (categoryFilter && categoryFilter !== "All Items") {
      filtered = filtered.filter((i) => i.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    // Availability filter
    if (filters.availability === "available") {
      filtered = filtered.filter((i) => i.Availability);
    } else if (filters.availability === "unavailable") {
      filtered = filtered.filter((i) => !i.Availability);
    }

    // Price range filter (min/max)
    if (filters.minPrice && Number(filters.minPrice) > 0) {
      const minP = Number(filters.minPrice);
      filtered = filtered.filter((i) => (i.Price || 0) >= minP);
    }
    if (filters.maxPrice && Number(filters.maxPrice) > 0) {
      const maxP = Number(filters.maxPrice);
      filtered = filtered.filter((i) => (i.Price || 0) <= maxP);
    }

    setFilteredItems(filtered);
  };

  const fetchItems = async () => {
    try {
      setFetching(true);
      setError(null);
      // Fetch menu for the authenticated restaurant (derived from the token)
      const res = await api.get("/restraunt/menu/mine");
      const menuItems = res.data?.menu?.FoodItems || [];
      setItems(menuItems);
      setFilteredItems(menuItems);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch items");
      pushToast("Failed to fetch items", "error");
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      name: "", 
      Price: 0, 
      description: "", 
      category: "", 
      Availability: true,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditing(null);
    setIsDialogOpen(false);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
    setTimeout(() => (document.querySelector('#name-input') as HTMLElement | null)?.focus(), 50);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      Price: item.Price || 0,
      description: item.description || "",
        category: item.category || "",
        Availability: item.Availability ?? true,
    });
    setPhotoPreview(item.Photo?.[0]?.url || null);
    setPhotoFile(null);
    setIsDialogOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item? This action cannot be undone.")) return;
    const prev = items;
    setItems((it) => it.filter((x) => x._id !== id));
    setFilteredItems((it) => it.filter((x) => x._id !== id));
    try {
      await api.delete(`/restraunt/deleteiteam/${id}`);
      pushToast("Item deleted");
    } catch (err: any) {
      setItems(prev);
      setFilteredItems(prev);
      console.error(err);
      pushToast("Failed to delete item", "error");
    }
    setActionMenuOpen(null);
  };

  const handleToggleAvailability = async (item) => {
    const prev = items;
    const updated = items.map((i) => (i._id === item._id ? { ...i, Availability: !i.Availability } : i));
    setItems(updated);
    setFilteredItems(updated.filter((i) => {
      if (categoryFilter === "All Items") return true;
      return i.category === categoryFilter;
    }));
    try {
      await api.put(`/restraunt/updateavailability/${item._id}`, { Availability: !item.Availability });
      pushToast(`Marked ${item.name} as ${!item.Availability ? "available" : "unavailable"}`);
    } catch (err: any) {
      setItems(prev);
      setFilteredItems(prev);
      console.error(err);
      pushToast("Failed to update availability", "error");
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setPhotoPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    handleImageSelect(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleImageSelect(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return pushToast("Name is required", "error");
    try {
      setLoading(true);
      if (editing && editing._id) {
        const payload = { ...form };
        await api.put(`/restraunt/updateiteam/${editing._id}`, payload);
        pushToast("Item updated");
      } else {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
          formData.append(key, String(form[key]));
        });
        if (photoFile) formData.append("Photo", photoFile);
        await api.post("/restraunt/additeam", formData);
        pushToast("Item added");
      }
      await fetchItems();
      resetForm();
    } catch (err: any) {
      console.error(err);
      pushToast("Failed to save item", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      availability: "all",
      minPrice: 0,
      maxPrice: 0,
    });
  };

  const totalItems = items.length;
  const availableCount = items.filter((i) => i.Availability).length;
  const totalValue = items.reduce((sum, item) => sum + (item.Price || 0), 0);

  // Group items by category for the "all" view
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Derive categories from items (first entry is 'All Items')
  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ["All Items", ...Array.from(set)];
  }, [items]);

  return (
    <BasicLayout menuItems={menuItems}>
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />

     {/* Restaurant Hero Section */}
<div
  className="relative mb-6 rounded-2xl overflow-hidden shadow-lg"
  style={{
    backgroundImage: `
      linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65)),
      url('https://images.unsplash.com/photo-1551218808-94e220e084d2')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "380px",
  }}
>
  {/* Lighting Overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30"></div>

  <div className="relative z-10 px-6 py-10 h-full flex flex-col justify-center">
    {/* Title + Icon */}
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-black/30 backdrop-blur-sm rounded-xl shadow">
        <ChefHat className="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 className="text-4xl font-extrabold text-white drop-shadow">
          Menu Management
        </h1>
        <p className="text-white/90 text-base max-w-xl mt-1">
          Manage your restaurant dishes, categories, pricing, and availability.
        </p>
      </div>
    </div>

    {/* Buttons Row */}
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={() => fetchItems()}
        disabled={fetching}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white 
                   border border-white/40 rounded-lg hover:bg-white/10 
                   transition-all backdrop-blur-sm"
      >
        <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
        Refresh
      </button>

      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold 
                   text-gray-900 bg-white rounded-lg hover:bg-gray-100 
                   shadow-lg transition-all"
      >
        <Plus className="w-4 h-4" />
        Add New Item
      </button>
    </div>
  </div>
</div>


      <div className="flex gap-6">
        {/* Left Filters Sidebar - Updated style */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
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

            {/* Categories Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const count = category === "All Items"
                    ? items.length
                    : items.filter(i => i.category === category).length;

                  return (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                        categoryFilter === category
                          ? "bg-[#003d52]/10 text-[#003d52] font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {categoryFilter === category && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        categoryFilter === category
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

            {/* Availability Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Availability</h3>
              <div className="space-y-1">
                {["all", "available", "unavailable"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange("availability", option)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                      filters.availability === option
                        ? "bg-[#003d52]/10 text-[#003d52] font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option === "all" ? "All Items" : 
                     option === "available" ? "Available Only" : "Unavailable Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter (improved UX) */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h3>
              <div className="space-y-3">
                <PriceRangeControl
                  items={items}
                  filters={filters}
                  setFilters={setFilters}
                />
              </div>
            </div>

            {/* (Rating and Popular filters removed per request) */}
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
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52] text-sm"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
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

          {/* Menu Items Grid/List */}
          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No items found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-[#003d52] text-white rounded-lg hover:bg-[#021920] transition-colors text-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : categoryFilter === "All Items" && viewMode === "grid" ? (
            // Grouped by category view
            <div className="space-y-8">
              {Object.entries(groupedItems as Record<string, any[]>).map(([category, categoryItems]) => {
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                        </span>
                      </h2>
                     
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoryItems.map((item) => (
                        <div 
                          key={item._id}
                          className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 relative group"
                        >
                          {/* Image Section */}
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={item.Photo?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {!item.Availability && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-medium text-sm bg-black/70 px-3 py-1 rounded">
                                  Unavailable
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">{item.name}</h3>
                              <span className="text-lg font-bold text-[#003d52] whitespace-nowrap">
                                ${Number(item.Price).toFixed(2)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${item.Availability ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-xs text-gray-600">
                                  {item.Availability ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2" ref={actionMenuRef}>
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    item.Availability ? "bg-green-500" : "bg-red-500"
                                  }`}
                                >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    item.Availability ? "translate-x-5" : "translate-x-1"
                                  }`} />
                                </button>
                                
                                <button
                                  onClick={() => setActionMenuOpen(actionMenuOpen === item._id ? null : item._id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <div className="w-5 h-5 flex flex-col justify-center gap-1">
                                    <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                                  </div>
                                </button>
                                
                                {actionMenuOpen === item._id && (
                                  <div className="absolute right-2 bottom-14 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      Edit Item
                                    </button>
                                    <button
                                      onClick={() => handleToggleAvailability(item)}
                                      className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                      {item.Availability ? (
                                        <>
                                          <EyeOff className="w-4 h-4" />
                                          Mark Unavailable
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-4 h-4" />
                                          Mark Available
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item._id)}
                                      className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single view (either category filtered or list view)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item._id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 relative group"
                >
                  {/* Image Section */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.Photo?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!item.Availability && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-medium text-sm bg-black/70 px-3 py-1 rounded">
                          Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">{item.name}</h3>
                      <span className="text-lg font-bold text-[#003d52] whitespace-nowrap">
                        ${Number(item.Price).toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.Availability ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-600">
                          {item.Availability ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2" ref={actionMenuRef}>
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            item.Availability ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            item.Availability ? "translate-x-5" : "translate-x-1"
                          }`} />
                        </button>
                        
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === item._id ? null : item._id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <div className="w-5 h-5 flex flex-col justify-center gap-1">
                            <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full mx-auto"></div>
                          </div>
                        </button>
                        
                        {actionMenuOpen === item._id && (
                          <div className="absolute right-2 bottom-14 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => handleEdit(item)}
                              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Item
                            </button>
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                              {item.Availability ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Mark Unavailable
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Mark Available
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div ref={modalRef} className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editing ? "Edit Menu Item" : "Add New Item"}</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
              </div>
              <button
                onClick={resetForm}
                aria-label="Close"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Photo</label>
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`border-2 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center ${
                    dragOver ? "border-dashed border-[#003d52] bg-[#003d52]/5" : "border-gray-300 border-dashed bg-gray-50"
                  }`}
                >
                  <div className="w-32 h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center border">
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">Drop an image here or click to browse</div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Choose File
                      </span>
                      <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    id="name-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52]"
                    placeholder="e.g., Margherita Pizza"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.Price}
                        onChange={(e) => setForm({ ...form, Price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52]"
                      placeholder="e.g., Appetizers, Main Courses, Desserts"
                    />
                  </div>
                </div>
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003d52] focus:border-[#003d52] resize-none"
                    placeholder="Describe the item..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-700">Availability</div>
                    <div className="text-sm text-gray-500">Show this item to customers</div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, Availability: !form.Availability })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.Availability ? "bg-green-500" : "bg-red-500"
                    }`}
                    aria-pressed={form.Availability}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.Availability ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6">
              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[#003d52] text-white font-medium rounded-lg hover:bg-[#021920] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </div>
                  ) : editing ? (
                    "Update Item"
                  ) : (
                    "Add Item"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </BasicLayout>
  );
}