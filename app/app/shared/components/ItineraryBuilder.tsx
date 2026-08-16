"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Calendar,
  Clock,
  Car,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ItineraryItem {
  id: string;
  type: "attraction" | "travel";
  date: string;
  name?: string;
  from?: string;
  to?: string;
  imageFile?: File;
  fromLocation?: string;
  toLocation?: string;
  time?: string;
}

interface ItineraryBuilderProps {
  startDate: string;
  endDate: string;
  initialItinerary?: ItineraryItem[];
  onChange?: (itineraryArray: ItineraryItem[]) => void;
}

const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  startDate,
  endDate,
  initialItinerary,
  onChange,
}) => {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [itemType, setItemType] = useState<"attraction" | "travel">("attraction");

  const emptyItem: ItineraryItem = {
    id: "",
    type: "attraction",
    date: "",
    name: "",
    from: "",
    to: "",
    imageFile: undefined,
  };

  const [formData, setFormData] = useState<ItineraryItem>(emptyItem);

  const getTotalDays = (): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const totalDays = getTotalDays();

  useEffect(() => {
    if (initialItinerary && Array.isArray(initialItinerary)) {
      setItems(initialItinerary);
    } else {
      setItems([]);
    }
  }, [initialItinerary]);

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 || 12;
    return `${display}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDayNumber = (dateStr: string): number => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const itemDate = new Date(dateStr);
    const diffTime = itemDate.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const groupItemsByDay = () => {
    const grouped: { [key: number]: ItineraryItem[] } = {};
    items
      .sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
        const timeA = a.time || a.from || "00:00";
        const timeB = b.time || b.from || "00:00";
        return timeA.localeCompare(timeB);
      })
      .forEach((item) => {
        const day = getDayNumber(item.date);
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(item);
      });
    return grouped;
  };

  const getDateForDay = (day: number): string => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setDate(date.getDate() + (day - 1));
    return date.toISOString().split("T")[0];
  };

  const handleOpenModal = (type: "attraction" | "travel", item?: ItineraryItem) => {
    if (item) {
      setFormData(item);
      setEditingItem(item);
      setItemType(item.type);
    } else {
      const newItem: ItineraryItem = {
        id: Date.now().toString(),
        type,
        date: getDateForDay(1),
        ...(type === "attraction" 
          ? { name: "", from: "", to: "", imageFile: undefined }
          : { fromLocation: "", toLocation: "", time: "" }
        ),
      };
      setFormData(newItem);
      setEditingItem(null);
      setItemType(type);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(emptyItem);
    setEditingItem(null);
  };

  const handleSaveItem = () => {
    const itemDay = getDayNumber(formData.date);
    if (itemDay < 1 || itemDay > totalDays) {
      alert(`Date must be within trip dates (Day 1 - Day ${totalDays})`);
      return;
    }

    if (formData.type === "attraction") {
      if (!formData.name || !formData.from || !formData.to) {
        alert("Please fill in attraction name, from time, and to time");
        return;
      }
      if (formData.from >= formData.to) {
        alert("'To' time must be after 'From' time");
        return;
      }
    } else {
      if (!formData.fromLocation || !formData.toLocation || !formData.time) {
        alert("Please fill in from location, to location, and time");
        return;
      }
    }

    const updated = editingItem
      ? items.map((item) => (item.id === editingItem.id ? formData : item))
      : [...items, formData];

    setItems(updated);
    onChange?.(updated);
    handleCloseModal();
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    onChange?.(updated);
  };

  const renderEditView = () => {
    const grouped = groupItemsByDay();
    const hasItems = Object.keys(grouped).length > 0;

    return (
      <div className="space-y-3">
        {!hasItems ? (
          <div className="text-center py-12 bg-white border border-gray-200">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-xs mb-3">No itinerary items yet</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleOpenModal("attraction")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003d52] text-white text-xs font-medium hover:bg-[#021920] transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Attraction
              </button>
              <button
                onClick={() => handleOpenModal("travel")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
              >
                <Car className="h-3.5 w-3.5" /> Add Travel
              </button>
            </div>
          </div>
        ) : (
          <>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const dayItems = grouped[day] || [];
              const dayDate = getDateForDay(day);

              return (
                <div key={day} className="border border-gray-200">
                  <div className="bg-[#003d52] text-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <h3 className="font-medium text-xs">
                        Day {day} - {formatDate(dayDate)}
                      </h3>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dayItems.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50">
                        <p className="text-sm text-gray-500 mb-3">
                          No activities planned for this day
                        </p>
                      </div>
                    ) : (
                      dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white hover:bg-gray-50 transition px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[140px]">
                              {item.type === "attraction" ? (
                                <MapPin className="h-3.5 w-3.5 text-[#003d52]" />
                              ) : (
                                <Car className="h-3.5 w-3.5 text-gray-400" />
                              )}
                              <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                {item.type === "attraction"
                                  ? `${formatTime(item.from || "")} - ${formatTime(item.to || "")}`
                                  : formatTime(item.time || "")}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 ${
                                  item.type === "attraction"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                } text-xs font-medium`}
                              >
                                {item.type === "attraction" ? "Attraction" : "Travel"}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs text-gray-900">
                                {item.type === "attraction"
                                  ? item.name
                                  : `${item.fromLocation} → ${item.toLocation}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => handleOpenModal(item.type, item)}
                                className="p-1 text-gray-500 hover:bg-gray-100 transition"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-gray-500 hover:bg-gray-100 transition"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => handleOpenModal("attraction")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003d52] text-white text-xs font-medium hover:bg-[#021920] transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Attraction
              </button>
              <button
                onClick={() => handleOpenModal("travel")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
              >
                <Car className="h-3.5 w-3.5" /> Add Travel
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#003d52]" />
              <h2 className="text-sm font-semibold text-gray-900">Trip Itinerary</h2>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium">
                {items.length}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Expand
                </>
              )}
            </button>
          </div>
        </div>
        {isExpanded && <div className="p-3">{renderEditView()}</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-lg">
            <div className="border-b border-gray-200 px-3 py-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {editingItem
                  ? `Edit ${formData.type === "attraction" ? "Attraction" : "Travel"}`
                  : `Add ${formData.type === "attraction" ? "Attraction" : "Travel"}`}
              </h3>
            </div>

            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={startDate ? startDate.split("T")[0] : ""}
                  max={endDate ? endDate.split("T")[0] : ""}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                />
              </div>

              {itemType === "attraction" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Attraction Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Eiffel Tower"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        From Time *
                      </label>
                      <input
                        type="time"
                        value={formData.from || ""}
                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        To Time *
                      </label>
                      <input
                        type="time"
                        value={formData.to || ""}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Image (optional)
                    </label>
                    {formData.imageFile instanceof File ? (
                      <div className="mb-2">
                        <div className="relative inline-block">
                          <img
                            src={URL.createObjectURL(formData.imageFile)}
                            alt="Preview"
                            className="w-full max-w-xs h-32 object-cover rounded border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageFile: undefined })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded px-3 py-2 text-center hover:border-[#003d52] transition">
                          <span className="text-xs text-gray-600">Choose Image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, imageFile: file });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      From Location *
                    </label>
                    <input
                      type="text"
                      value={formData.fromLocation || ""}
                      onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                      placeholder="e.g., Hotel"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      To Location *
                    </label>
                    <input
                      type="text"
                      value={formData.toLocation || ""}
                      onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                      placeholder="e.g., Airport"
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.time || ""}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#003d52] focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-3 py-2 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-3 py-1.5 text-xs font-medium bg-[#003d52] text-white hover:bg-[#021920] transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryBuilder;