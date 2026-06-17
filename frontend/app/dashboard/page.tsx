"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  QrCode, LayoutDashboard, Utensils, Settings, LogOut, Plus, Search,
  Menu, X, Loader2, RefreshCw, Crown, AlertCircle, Clock, BadgeCheck,
  BarChart3, MapPin, Clock3, ArrowRight, CheckCircle, Info, Camera,
} from "lucide-react";
import OverviewTab from "./overview/OverviewTab";
import MenuTab from "./menu/MenuTab";
import CategoriesTab from "./categories/CategoriesTab";
import QRTab from "./qr/QRTab";
import AnalyticsTab from "./analytics/AnalyticsTab";
import LocationsTab from "./locations/LocationsTab";
import SchedulesTab from "./schedules/SchedulesTab";
import SettingsTab from "./settings/SettingsTab";
import "./dashboard.css";

/* ===================================================================
   TYPES
   =================================================================== */

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  status: string;
  popular: boolean;
  image: string | null;
  category: { id: string; name: string } | null;
  locationId: string | null;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  locationId?: string | null;
}

interface SubscriptionInfo {
  id: string;
  plan: string;
  price: number;
  billingCycle: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  purchasedAt: string;
  daysRemaining: number;
  status: string;
}

interface PlanInfo {
  plan: string;
  itemCount: number;
  itemLimit: number;
  itemRemaining: number;
  categoryCount: number;
  categoryLimit: number;
  categoryRemaining: number;
  isFree: boolean;
  hasWatermark: boolean;
  isNearItemLimit: boolean;
  isNearCategoryLimit: boolean;
  subscription: SubscriptionInfo | null;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: { label: string; href: string };
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

interface Schedule {
  id: string;
  name: string;
  description: string | null;
  scheduledAt: string;
  appliedAt: string | null;
  status: string;
  action: string;
  payload: string;
  createdAt: string;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: "primary" | "danger";
  onConfirm: () => void;
}

/* ===================================================================
   CONSTANTS
   =================================================================== */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_PLAN_INFO: PlanInfo = {
  plan: "FREE",
  itemCount: 0,
  itemLimit: 10,
  itemRemaining: 10,
  categoryCount: 0,
  categoryLimit: 5,
  categoryRemaining: 5,
  isFree: true,
  hasWatermark: true,
  isNearItemLimit: false,
  isNearCategoryLimit: false,
  subscription: null,
};

const DEFAULT_CONFIRM: ConfirmConfig = {
  title: "",
  message: "",
  confirmLabel: "Confirm",
  confirmVariant: "primary",
  onConfirm: () => {},
};

const NAV_ITEMS = [
  { tab: "overview", icon: <LayoutDashboard size={18} />, label: "Overview" },
  { tab: "menu", icon: <Utensils size={18} />, label: "Menu Items" },
  { tab: "categories", icon: <LayoutDashboard size={18} />, label: "Categories" },
  { tab: "qr", icon: <QrCode size={18} />, label: "QR Code" },
  { tab: "analytics", icon: <BarChart3 size={18} />, label: "Analytics" },
  { tab: "locations", icon: <MapPin size={18} />, label: "Locations" },
  { tab: "schedules", icon: <Clock3 size={18} />, label: "Schedules" },
  { tab: "settings", icon: <Settings size={18} />, label: "Settings" },
];

/* ===================================================================
   MAIN PAGE COMPONENT
   =================================================================== */

export default function DashboardPage() {
  const { user, loading, checkAuth, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setInitialCheckDone(true);
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    if (initialCheckDone && !loading && !user) {
      router.push("/login");
    }
  }, [initialCheckDone, loading, user, router]);

  if (!initialCheckDone || loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="dashboard-loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return <DashboardContent user={user} onLogout={logout} upgraded={upgraded} />;
}

/* ===================================================================
   DASHBOARD CONTENT
   =================================================================== */

function DashboardContent({ user, onLogout, upgraded }: { user: any; onLogout: () => Promise<void>; upgraded: boolean }) {
  const router = useRouter();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loggingOut, setLoggingOut] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo>(DEFAULT_PLAN_INFO);
  const [locations, setLocations] = useState<Location[]>([]);
  const [maxLocations, setMaxLocations] = useState(1);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formStatus, setFormStatus] = useState("available");
  const [formPopular, setFormPopular] = useState(false);
  const [formLocationId, setFormLocationId] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Image Upload State
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormDescription, setCategoryFormDescription] = useState("");
  const [categoryFormLocationId, setCategoryFormLocationId] = useState("");
  const [categoryFormError, setCategoryFormError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [initializingCategories, setInitializingCategories] = useState(false);

  // Confirm Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>(DEFAULT_CONFIRM);

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationFormName, setLocationFormName] = useState("");
  const [locationFormAddress, setLocationFormAddress] = useState("");
  const [locationFormPhone, setLocationFormPhone] = useState("");
  const [locationFormError, setLocationFormError] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFormName, setScheduleFormName] = useState("");
  const [scheduleFormDescription, setScheduleFormDescription] = useState("");
  const [scheduleFormScheduledAt, setScheduleFormScheduledAt] = useState("");
  const [scheduleFormAction, setScheduleFormAction] = useState("TOGGLE_ITEM_STATUS");
  const [scheduleFormItemId, setScheduleFormItemId] = useState("");
  const [scheduleFormNewPrice, setScheduleFormNewPrice] = useState("");
  const [scheduleFormError, setScheduleFormError] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Misc
  const [deletingAll, setDeletingAll] = useState(false);
  const initialDataLoaded = useRef(false);
  const upgradeToastShown = useRef(false);

  /* ===================================================================
     HELPERS
     =================================================================== */

  const navigateToMembership = useCallback(() => router.push("/membership"), [router]);

  const getAccessToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, []);

  const addToast = useCallback((type: "success" | "error" | "info", message: string, action?: { label: string; href: string }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getInitials = (name: string) => {
    return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  };

  /* ===================================================================
     FETCH FUNCTIONS
     =================================================================== */

  const fetchPlanInfo = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/plan/info`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) setPlanInfo(await response.json());
    } catch (err) { console.error("fetchPlanInfo error:", err); }
  }, [getAccessToken]);

  const fetchMenuItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setMenuItems(await response.json());
    } catch (err) { console.error("fetchMenuItems error:", err); }
    finally { setLoadingItems(false); }
  }, [getAccessToken]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setCategories(await response.json());
    } catch (err) { console.error("fetchCategories error:", err); }
  }, [getAccessToken]);

  const fetchDefaultCategories = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/categories/default`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) setDefaultCategories((await response.json()).categories);
    } catch (err) { console.error("fetchDefaultCategories error:", err); }
  }, [getAccessToken]);

  const fetchLocations = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/locations`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations);
        setMaxLocations(data.maxLocations);
      }
    } catch (err) { console.error("fetchLocations error:", err); }
  }, [getAccessToken]);

  const fetchSchedules = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/schedules`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) setSchedules(await response.json());
    } catch (err) { console.error("fetchSchedules error:", err); }
  }, [getAccessToken]);

  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMenuItems(), fetchCategories(), fetchPlanInfo(), fetchDefaultCategories()]);
    setRefreshing(false);
  }, [fetchMenuItems, fetchCategories, fetchPlanInfo, fetchDefaultCategories]);

  /* ===================================================================
     IMAGE UPLOAD HANDLER
     ---------------------------------------------------------------
     Uploads the selected file to /api/menu/upload-image and returns
     the Cloudinary URL.  itemId is optional — for NEW items it will
     be an empty string and the backend will skip the ownership check.
     =================================================================== */

  const handleImageUpload = useCallback(async (itemId: string = ''): Promise<string | null> => {
    if (!itemImageFile) return null;

    setUploadingImage(true);
    try {
      const token = getAccessToken();
      if (!token) {
        addToast("error", "Session expired — please log in again.");
        return null;
      }

      const formData = new FormData();
      // Field name MUST match what multer expects: upload.single('image')
      formData.append('image', itemImageFile);
      // Only append itemId when it is a real, non-empty UUID
      if (itemId && itemId.trim() !== '') {
        formData.append('itemId', itemId);
      }

      console.log('Uploading image to:', `${API_URL}/api/menu/upload-image`);
      console.log('File name:', itemImageFile.name, '| size:', itemImageFile.size, 'bytes');

      const response = await fetch(`${API_URL}/api/menu/upload-image`, {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here — the browser sets it automatically
          // including the multipart boundary when body is FormData.
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful, URL:', data.imageUrl);
        addToast("success", "Image uploaded successfully!");
        return data.imageUrl as string;
      } else {
        let errorMessage = "Image upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch { /* response wasn't JSON */ }
        console.error("Upload failed with status:", response.status, errorMessage);
        addToast("error", errorMessage);
        return null;
      }
    } catch (error) {
      console.error("Image upload network error:", error);
      addToast("error", "Image upload failed — check your connection.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [itemImageFile, getAccessToken, addToast]);

  /* ===================================================================
     ITEM HANDLERS
     =================================================================== */

  const handleSaveItem = async () => {
    setFormError("");
    if (!formName.trim()) { setFormError("Item name is required"); return; }
    if (!formPrice || parseFloat(formPrice) <= 0) { setFormError("Valid price is required"); return; }
    if (!editingItem && menuItems.length >= planInfo.itemLimit) {
      setFormError(`Item limit reached (${menuItems.length}/${planInfo.itemLimit}). Please upgrade to add more items.`);
      return;
    }
    setSaving(true);
    try {
      const token = getAccessToken();
      if (!token) { setFormError("Please login again"); return; }

      // Step 1 — upload the image first (before the item even exists for new items).
      // For new items we pass '' as itemId; the backend skips the ownership check
      // when itemId is absent/empty, so this is safe.
      let imageUrl: string | null = editingItem?.image ?? null;
      if (itemImagePreview && itemImageFile) {
        // There's a new file selected — upload it
        const uploadedUrl = await handleImageUpload(editingItem?.id ?? '');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Upload failed — toast was already shown inside handleImageUpload
          setSaving(false);
          return;
        }
      } else if (!itemImagePreview && editingItem?.image) {
        // User explicitly removed the image
        imageUrl = null;
      }

      // Step 2 — create or update the menu item with the resolved imageUrl
      const url = editingItem ? `${API_URL}/api/menu/${editingItem.id}` : `${API_URL}/api/menu`;
      const method = editingItem ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          price: parseFloat(formPrice),
          categoryId: formCategoryId || null,
          status: formStatus,
          popular: formPopular,
          locationId: formLocationId || null,
          image: imageUrl,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setItemImageFile(null);
        setItemImagePreview(null);
        addToast("success", editingItem ? "Item updated successfully!" : "Item added successfully!");
        await refreshAllData();
      } else if (response.status === 403) {
        setFormError((await response.json()).message);
      } else {
        setFormError((await response.json()).message || "Failed to save");
      }
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  };

  const handleDeleteItem = (id: string) => {
    setConfirmConfig({
      title: "Delete Item?", message: "This action cannot be undone.", confirmLabel: "Delete", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const token = getAccessToken(); if (!token) return;
          await fetch(`${API_URL}/api/menu/${id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
          addToast("success", "Item deleted!");
          await refreshAllData();
        } catch { addToast("error", "Failed to delete item"); }
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteAllItems = () => {
    if (menuItems.length === 0) { addToast("info", "No items to delete."); return; }
    setConfirmConfig({
      title: "Delete All Items?", message: `Delete all ${menuItems.length} items?`, confirmLabel: "Delete All", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false); setDeletingAll(true);
        try {
          const token = getAccessToken(); if (!token) return;
          let deleted = 0, failed = 0;
          for (const item of menuItems) {
            try {
              const response = await fetch(`${API_URL}/api/menu/${item.id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
              response.ok ? deleted++ : failed++;
            } catch { failed++; }
          }
          await refreshAllData();
          addToast(failed === 0 ? "success" : "info", failed === 0 ? `All ${deleted} items deleted!` : `${deleted} deleted, ${failed} failed.`);
        } catch { addToast("error", "Failed"); }
        finally { setDeletingAll(false); }
      }
    });
    setShowConfirm(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = getAccessToken(); if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/${id}/toggle-status`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        addToast("info", `Item marked as ${data.status === "available" ? "available" : "sold out"}`);
        await refreshAllData();
      }
    } catch { addToast("error", "Failed"); }
  };

  const handleTogglePopular = async (id: string) => {
    try {
      const token = getAccessToken(); if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/${id}/toggle-popular`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        addToast("info", data.popular ? "Marked popular!" : "Removed from popular");
        await refreshAllData();
      }
    } catch { addToast("error", "Failed"); }
  };

  const openAddItem = () => {
    if (menuItems.length >= planInfo.itemLimit) {
      addToast("error", "Item limit reached.", { label: "Upgrade", href: "/membership" }); return;
    }
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategoryId(selectedCategory !== "all" ? selectedCategory : "");
    setFormStatus("available");
    setFormPopular(false);
    setFormLocationId("");
    setFormError("");
    setItemImageFile(null);
    setItemImagePreview(null);
    setShowAddModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormPrice(item.price.toString());
    setFormCategoryId(item.categoryId || "");
    setFormStatus(item.status);
    setFormPopular(item.popular);
    setFormLocationId(item.locationId || "");
    setFormError("");
    setItemImageFile(null);
    // Show existing image as preview so the user can see it and optionally replace it
    setItemImagePreview(item.image || null);
    setShowAddModal(true);
  };

  /* ===================================================================
     CATEGORY HANDLERS
     =================================================================== */

  const handleSaveCategory = async () => {
    setCategoryFormError("");
    if (!categoryFormName.trim()) { setCategoryFormError("Category name is required"); return; }
    if (!editingCategory && categories.length >= planInfo.categoryLimit) {
      setCategoryFormError(`Limit reached (${categories.length}/${planInfo.categoryLimit}).`); return;
    }
    setSavingCategory(true);
    try {
      const token = getAccessToken(); if (!token) return;
      const url = editingCategory ? `${API_URL}/api/menu/categories/${editingCategory.id}` : `${API_URL}/api/menu/categories`;
      const method = editingCategory ? "PUT" : "POST";
      const response = await fetch(url, {
        method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: categoryFormName.trim(), description: categoryFormDescription.trim(), locationId: categoryFormLocationId || null })
      });
      if (response.ok) {
        setShowCategoryModal(false);
        addToast("success", editingCategory ? "Category updated!" : "Category created!");
        await refreshAllData();
      } else if (response.status === 403) { setCategoryFormError((await response.json()).message); }
      else { setCategoryFormError((await response.json()).message || "Failed"); }
    } catch { setCategoryFormError("Network error"); }
    finally { setSavingCategory(false); }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmConfig({
      title: "Delete Category?", message: "Items will become uncategorized.", confirmLabel: "Delete", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const token = getAccessToken(); if (!token) return;
          await fetch(`${API_URL}/api/menu/categories/${id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
          addToast("success", "Category deleted!");
          await refreshAllData();
        } catch { addToast("error", "Failed"); }
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteAllCategories = () => {
    if (categories.length === 0) { addToast("info", "No categories."); return; }
    setConfirmConfig({
      title: "Delete All Categories?", message: `Delete all ${categories.length} categories?`, confirmLabel: "Delete All", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false); setDeletingAll(true);
        try {
          const token = getAccessToken(); if (!token) return;
          let deleted = 0, failed = 0;
          for (const cat of categories) {
            try {
              const response = await fetch(`${API_URL}/api/menu/categories/${cat.id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
              response.ok ? deleted++ : failed++;
            } catch { failed++; }
          }
          await refreshAllData();
          addToast(failed === 0 ? "success" : "info", failed === 0 ? `All ${deleted} deleted!` : `${deleted} deleted, ${failed} failed.`);
        } catch { addToast("error", "Failed"); }
        finally { setDeletingAll(false); }
      }
    });
    setShowConfirm(true);
  };

  const handleLoadDefaultCategories = () => {
    if (categories.length >= planInfo.categoryLimit) {
      addToast("error", "Category limit reached.", { label: "Upgrade", href: "/membership" }); return;
    }
    const remainingSlots = planInfo.categoryLimit - categories.length;
    const categoriesToLoad = defaultCategories.slice(0, remainingSlots);
    setConfirmConfig({
      title: "Load Default Categories?", message: `Add ${categoriesToLoad.length} default categories?`, confirmLabel: `Load ${categoriesToLoad.length}`, confirmVariant: "primary",
      onConfirm: async () => {
        setShowConfirm(false); setInitializingCategories(true);
        try {
          const token = getAccessToken(); if (!token) return;
          const response = await fetch(`${API_URL}/api/menu/categories/bulk`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ categories: categoriesToLoad })
          });
          const data = await response.json();
          await refreshAllData();
          addToast("success", data.message || `Loaded ${data.created?.length || categoriesToLoad.length} categories!`);
        } catch { addToast("error", "Failed"); }
        finally { setInitializingCategories(false); }
      }
    });
    setShowConfirm(true);
  };

  const openAddCategory = () => {
    if (categories.length >= planInfo.categoryLimit) {
      addToast("error", "Limit reached.", { label: "Upgrade", href: "/membership" }); return;
    }
    setEditingCategory(null); setCategoryFormName(""); setCategoryFormDescription("");
    setCategoryFormLocationId(""); setCategoryFormError(""); setShowCategoryModal(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category); setCategoryFormName(category.name);
    setCategoryFormDescription(category.description || ""); setCategoryFormLocationId(category.locationId || "");
    setCategoryFormError(""); setShowCategoryModal(true);
  };

  /* ===================================================================
     LOCATION HANDLERS
     =================================================================== */

  const handleSaveLocation = async () => {
    setLocationFormError("");
    if (!locationFormName.trim()) { setLocationFormError("Name required"); return; }
    if (!editingLocation && locations.length >= maxLocations) {
      setLocationFormError(`Limit reached (${locations.length}/${maxLocations}).`); return;
    }
    setSavingLocation(true);
    try {
      const token = getAccessToken(); if (!token) return;
      const url = editingLocation ? `${API_URL}/api/menu/locations/${editingLocation.id}` : `${API_URL}/api/menu/locations`;
      const method = editingLocation ? "PUT" : "POST";
      const response = await fetch(url, {
        method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: locationFormName.trim(), address: locationFormAddress.trim(), phone: locationFormPhone.trim() })
      });
      if (response.ok) {
        setShowLocationModal(false);
        addToast("success", editingLocation ? "Updated!" : "Created!");
        await fetchLocations();
      } else if (response.status === 403) { setLocationFormError((await response.json()).message); }
      else { setLocationFormError((await response.json()).message || "Failed"); }
    } catch { setLocationFormError("Network error"); }
    finally { setSavingLocation(false); }
  };

  const handleDeleteLocation = (id: string) => {
    setConfirmConfig({
      title: "Delete Location?", message: "Items will be unlinked.", confirmLabel: "Delete", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const token = getAccessToken(); if (!token) return;
          await fetch(`${API_URL}/api/menu/locations/${id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
          addToast("success", "Deleted!");
          await fetchLocations();
        } catch { addToast("error", "Failed"); }
      }
    });
    setShowConfirm(true);
  };

  const openAddLocation = () => {
    setEditingLocation(null); setLocationFormName(""); setLocationFormAddress("");
    setLocationFormPhone(""); setLocationFormError(""); setShowLocationModal(true);
  };

  const openEditLocation = (loc: Location) => {
    setEditingLocation(loc); setLocationFormName(loc.name); setLocationFormAddress(loc.address || "");
    setLocationFormPhone(loc.phone || ""); setShowLocationModal(true);
  };

  /* ===================================================================
     SCHEDULE HANDLERS
     =================================================================== */

  const handleSaveSchedule = async () => {
    setScheduleFormError("");
    if (!scheduleFormName.trim()) { setScheduleFormError("Schedule name is required"); return; }
    if (!scheduleFormScheduledAt) { setScheduleFormError("Date and time is required"); return; }
    if (!scheduleFormItemId) { setScheduleFormError("Please select an item"); return; }
    if (scheduleFormAction === 'UPDATE_ITEM_PRICE' && (!scheduleFormNewPrice || parseFloat(scheduleFormNewPrice) <= 0)) {
      setScheduleFormError("Valid price is required"); return;
    }

    let payload: any = { itemId: scheduleFormItemId };
    if (scheduleFormAction === 'UPDATE_ITEM_PRICE') {
      payload.newPrice = parseFloat(scheduleFormNewPrice);
    }

    setSavingSchedule(true);
    try {
      const token = getAccessToken(); if (!token) return;
      const response = await fetch(`${API_URL}/api/menu/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: scheduleFormName.trim(),
          description: scheduleFormDescription.trim(),
          scheduledAt: new Date(scheduleFormScheduledAt).toISOString(),
          action: scheduleFormAction,
          payload: payload
        })
      });
      if (response.ok) {
        setShowScheduleModal(false);
        addToast("success", "Schedule created successfully!");
        await fetchSchedules();
      }
      else { setScheduleFormError((await response.json()).message || "Failed to create schedule"); }
    } catch { setScheduleFormError("Network error"); }
    finally { setSavingSchedule(false); }
  };

  const handleDeleteSchedule = (id: string) => {
    setConfirmConfig({
      title: "Delete Schedule?", message: "This will be removed.", confirmLabel: "Delete", confirmVariant: "danger",
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const token = getAccessToken(); if (!token) return;
          await fetch(`${API_URL}/api/menu/schedules/${id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${token}` } });
          addToast("success", "Deleted!"); await fetchSchedules();
        } catch { addToast("error", "Failed"); }
      }
    });
    setShowConfirm(true);
  };

  const openAddSchedule = () => {
    setScheduleFormName("");
    setScheduleFormDescription("");
    setScheduleFormScheduledAt("");
    setScheduleFormAction("TOGGLE_ITEM_STATUS");
    setScheduleFormItemId("");
    setScheduleFormNewPrice("");
    setScheduleFormError("");
    setShowScheduleModal(true);
  };

  /* ===================================================================
     LOGOUT
     =================================================================== */

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await onLogout(); } catch {}
    finally { setLoggingOut(false); }
  };

  /* ===================================================================
     EFFECTS
     =================================================================== */

  useEffect(() => {
    if (!initialDataLoaded.current) { initialDataLoaded.current = true; refreshAllData(); }
  }, []);

  useEffect(() => {
    if (upgraded && !upgradeToastShown.current) { upgradeToastShown.current = true; addToast("success", "Your plan has been upgraded successfully!"); }
  }, [upgraded, addToast]);

  useEffect(() => { if (activeTab === "locations") fetchLocations(); }, [activeTab, fetchLocations]);
  useEffect(() => { if (activeTab === "schedules") fetchSchedules(); }, [activeTab, fetchSchedules]);

  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('dashboard-tab-change', handleTabChange as EventListener);
    return () => window.removeEventListener('dashboard-tab-change', handleTabChange as EventListener);
  }, []);

  /* ===================================================================
     COMPUTED VALUES
     =================================================================== */

  const isProOrAbove = planInfo.plan === 'PRO' || planInfo.plan === 'ENTERPRISE';
  const isItemLimitReached = menuItems.length >= planInfo.itemLimit;
  const isCategoryLimitReached = categories.length >= planInfo.categoryLimit;
  const isLocationLimitReached = locations.length >= maxLocations;
  const subscription = planInfo.subscription;
  const isSubscribed = subscription && subscription.status === 'active';
  const isExpired = subscription && subscription.status === 'expired';
  const showUpgradeButton = planInfo.plan === 'FREE' || planInfo.plan === 'STARTER';

  /* ===================================================================
     SHARED PROPS
     =================================================================== */

  const sharedProps = {
    user, planInfo, menuItems, categories, defaultCategories, locations, maxLocations, schedules,
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
    loadingItems, isProOrAbove, isSubscribed: !!isSubscribed, isExpired: !!isExpired, subscription: planInfo.subscription,
    isItemLimitReached, isCategoryLimitReached, isLocationLimitReached,
    getAccessToken, addToast, removeToast, navigateToMembership,
    refreshAllData, fetchMenuItems, fetchCategories, fetchLocations, fetchSchedules, fetchPlanInfo,
    setMenuItems, setCategories, setLocations, setSchedules, setPlanInfo,
    API_URL,
    showAddModal, setShowAddModal, editingItem, setEditingItem,
    formName, setFormName, formDescription, setFormDescription,
    formPrice, setFormPrice, formCategoryId, setFormCategoryId,
    formStatus, setFormStatus, formPopular, setFormPopular,
    formLocationId, setFormLocationId, formError, setFormError, saving, setSaving,
    handleSaveItem, handleDeleteItem, handleDeleteAllItems, handleToggleStatus, handleTogglePopular,
    openAddItem, openEditItem,
    showCategoryModal, setShowCategoryModal, editingCategory, setEditingCategory,
    categoryFormName, setCategoryFormName, categoryFormDescription, setCategoryFormDescription,
    categoryFormLocationId, setCategoryFormLocationId,
    categoryFormError, setCategoryFormError, savingCategory, setSavingCategory,
    initializingCategories, setInitializingCategories,
    handleSaveCategory, handleDeleteCategory, handleDeleteAllCategories,
    handleLoadDefaultCategories, openAddCategory, openEditCategory,
    showConfirm, setShowConfirm, confirmConfig, setConfirmConfig,
    showLocationModal, setShowLocationModal, editingLocation, setEditingLocation,
    locationFormName, setLocationFormName, locationFormAddress, setLocationFormAddress,
    locationFormPhone, setLocationFormPhone, locationFormError, setLocationFormError,
    savingLocation, setSavingLocation,
    handleSaveLocation, handleDeleteLocation, openAddLocation, openEditLocation,
    showScheduleModal, setShowScheduleModal,
    scheduleFormName, setScheduleFormName, scheduleFormDescription, setScheduleFormDescription,
    scheduleFormScheduledAt, setScheduleFormScheduledAt, scheduleFormAction, setScheduleFormAction,
    scheduleFormItemId, setScheduleFormItemId, scheduleFormNewPrice, setScheduleFormNewPrice,
    scheduleFormError, setScheduleFormError, savingSchedule, setSavingSchedule,
    handleSaveSchedule, handleDeleteSchedule, openAddSchedule,
    deletingAll,
    itemImageFile, setItemImageFile,
    itemImagePreview, setItemImagePreview,
    uploadingImage, setUploadingImage,
  };

  const bannerData = planInfo.isFree
    ? {
        type: (menuItems.length >= planInfo.itemLimit || categories.length >= planInfo.categoryLimit) ? "critical" : "info",
        message: menuItems.length >= planInfo.itemLimit
          ? `Item limit reached (${menuItems.length}/${planInfo.itemLimit}).`
          : `${menuItems.length}/${planInfo.itemLimit} items, ${categories.length}/${planInfo.categoryLimit} categories - Free Plan`
      }
    : null;

  /* ===================================================================
     RENDER
     =================================================================== */

  return (
    <div className="dashboard-root">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? <CheckCircle size={18} /> : toast.type === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
            </div>
            <div className="toast-content">
              <p className="toast-message">{toast.message}</p>
              {toast.action && <Link href={toast.action.href} className="toast-action">{toast.action.label} <ArrowRight size={12} /></Link>}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* Mobile Header */}
      <header className="dash-mobile-header">
        <button className="dash-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} type="button">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link href="/" className="dash-logo-mobile"><QrCode size={20} /><span>EasyMenu</span></Link>
        <button className="dash-notif-btn" onClick={handleLogout} disabled={loggingOut} type="button"><LogOut size={20} /></button>
      </header>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dash-sidebar-header">
          <Link href="/" className="dash-logo"><QrCode size={22} /><span>EasyMenu</span></Link>
        </div>
        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => {
            if ((item.tab === "locations" || item.tab === "schedules") && !isProOrAbove) return null;
            return (
              <button key={item.tab} className={`dash-nav-item ${activeTab === item.tab ? "active" : ""}`}
                onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }} type="button">
                {item.icon}<span>{item.label}</span>
              </button>
            );
          })}
          {!!isSubscribed ? (
            <div className="dash-sidebar-membership">
              <div className="dash-sidebar-membership-header"><BadgeCheck size={16} /><span>Membership Active</span></div>
              <div className="dash-sidebar-membership-info">
                <span className="dash-sidebar-membership-plan">{subscription!.plan.charAt(0) + subscription!.plan.slice(1).toLowerCase()} Plan</span>
                <span className="dash-sidebar-membership-days"><Clock size={12} />{subscription!.daysRemaining} days</span>
              </div>
              <button className="dash-sidebar-membership-manage" onClick={() => { setSidebarOpen(false); navigateToMembership(); }} type="button">Manage <ArrowRight size={14} /></button>
            </div>
          ) : isExpired ? (
            <div className="dash-sidebar-membership expired">
              <div className="dash-sidebar-membership-header"><AlertCircle size={16} /><span>Expired</span></div>
              <button className="dash-sidebar-membership-renew" onClick={() => { setSidebarOpen(false); navigateToMembership(); }} type="button"><Crown size={14} /> Renew <ArrowRight size={14} /></button>
            </div>
          ) : showUpgradeButton ? (
            <button className="dash-upgrade-link" onClick={() => { setSidebarOpen(false); navigateToMembership(); }} type="button">
              <Crown size={18} /><span>Upgrade Plan</span><ArrowRight size={14} />
            </button>
          ) : null}
        </nav>
        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <div className="dash-user-avatar">{user.restaurant?.name ? getInitials(user.restaurant.name) : getInitials(user.name)}</div>
            <div>
              <div className="dash-user-name">{user.restaurant?.name || user.name}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout} disabled={loggingOut} type="button">
            {loggingOut ? <Loader2 size={16} className="spinning" /> : <LogOut size={16} />}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="dash-main">
        {/* Top Bar */}
        <div className="dash-topbar">
          <div className="dash-search-wrap">
            <Search size={16} />
            <input type="text" placeholder="Search menu items..." className="dash-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="dash-topbar-actions">
            <button className="dash-btn-secondary" onClick={refreshAllData} disabled={refreshing} type="button" style={{ padding: '10px 16px', minWidth: '110px' }}>
              {refreshing ? <Loader2 size={16} className="spinning" /> : <RefreshCw size={16} />}
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            {planInfo.isFree && (
              <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button">
                <Crown size={16} /> <span>Upgrade</span>
              </button>
            )}
            {planInfo.plan === 'STARTER' && (
              <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button">
                <Crown size={16} /> <span>Upgrade to Pro</span>
              </button>
            )}
            {isExpired && (
              <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button" style={{ background: 'var(--red)' }}>
                <AlertCircle size={16} /> <span>Renew</span>
              </button>
            )}
            <button className="dash-btn-logout" onClick={handleLogout} disabled={loggingOut} type="button">
              <LogOut size={16} /><span>{loggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>

        {/* Limit Banner */}
        {bannerData && (
          <div className={`dash-limit-banner dash-limit-banner-${bannerData.type}`}>
            <div className="dash-limit-banner-content">
              <AlertCircle size={18} />
              <div className="dash-limit-banner-text">
                <span className="dash-limit-banner-message">{bannerData.message}</span>
                <div className="dash-limit-banner-stats">
                  <span className="dash-limit-stat"><Utensils size={12} />{menuItems.length}/{planInfo.itemLimit}</span>
                  <span className="dash-limit-divider">-</span>
                  <span className="dash-limit-stat"><LayoutDashboard size={12} />{categories.length}/{planInfo.categoryLimit}</span>
                </div>
              </div>
            </div>
            <button className="dash-limit-upgrade-btn" onClick={navigateToMembership} type="button">
              <Crown size={16} /><span>Upgrade Now</span><ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="dash-content">
          {activeTab === "overview" && <OverviewTab {...sharedProps} />}
          {activeTab === "menu" && <MenuTab {...sharedProps} />}
          {activeTab === "categories" && <CategoriesTab {...sharedProps} />}
          {activeTab === "qr" && <QRTab {...sharedProps} />}
          {activeTab === "analytics" && <AnalyticsTab {...sharedProps} />}
          {activeTab === "locations" && <LocationsTab {...sharedProps} />}
          {activeTab === "schedules" && <SchedulesTab {...sharedProps} />}
          {activeTab === "settings" && <SettingsTab {...sharedProps} />}
        </div>
      </main>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="dash-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h2>{editingItem ? "Edit Item" : "Add Item"}</h2>
              <button className="dash-modal-close" onClick={() => setShowAddModal(false)} type="button"><X size={20} /></button>
            </div>
            <div className="dash-modal-body">
              {formError && <div className="dash-form-error"><AlertCircle size={16} /><span>{formError}</span></div>}
              <div className="dash-form-group">
                <label>Name *</label>
                <input type="text" placeholder="e.g., Buff Momo" value={formName} onChange={(e) => setFormName(e.target.value)} className="dash-form-input" autoFocus />
              </div>
              <div className="dash-form-group">
                <label>Description</label>
                <textarea placeholder="Brief description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="dash-form-textarea" rows={2} />
              </div>
              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Price (NPR) *</label>
                  <input type="number" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="dash-form-input" min="0" step="0.01" />
                </div>
                <div className="dash-form-group">
                  <label>Category</label>
                  <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} className="dash-form-input">
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              {locations.length > 0 && (
                <div className="dash-form-group">
                  <label>Location</label>
                  <select value={formLocationId} onChange={(e) => setFormLocationId(e.target.value)} className="dash-form-input">
                    <option value="">All</option>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              )}
              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="dash-form-input">
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <div className="dash-form-group">
                  <label>Popular</label>
                  <div className="dash-popular-toggle" onClick={() => setFormPopular(!formPopular)}>
                    <input type="checkbox" checked={formPopular} onChange={(e) => setFormPopular(e.target.checked)} id="popular-checkbox" />
                    <label htmlFor="popular-checkbox" className="dash-popular-label">Mark as popular</label>
                  </div>
                </div>
              </div>

              {/* Image Upload Field */}
              <div className="dash-form-group">
                <label>Item Image</label>
                <div className="dash-image-upload-container">
                  {itemImagePreview ? (
                    <div className="dash-image-preview">
                      <img
                        src={itemImagePreview}
                        alt="Preview"
                        className="dash-image-preview-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <button
                        className="dash-image-remove-btn"
                        onClick={() => {
                          setItemImageFile(null);
                          setItemImagePreview(null);
                          if (editingItem) {
                            setEditingItem({ ...editingItem, image: null });
                          }
                        }}
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="dash-image-upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              addToast("error", "Image size must be less than 5MB");
                              return;
                            }
                            setItemImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setItemImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="dash-image-upload-input"
                        id="item-image-upload"
                      />
                      <label htmlFor="item-image-upload" className="dash-image-upload-label">
                        <Camera size={24} />
                        <span>Click to upload image</span>
                        <span className="dash-image-upload-hint">JPG, PNG, GIF up to 5MB</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn-secondary" onClick={() => setShowAddModal(false)} type="button">Cancel</button>
              <button className="dash-btn-primary" onClick={handleSaveItem} disabled={saving || uploadingImage} type="button">
                {saving || uploadingImage
                  ? <><Loader2 size={16} className="spinning" />{uploadingImage ? "Uploading..." : "Saving..."}</>
                  : <><Plus size={16} />{editingItem ? "Update" : "Add"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCategoryModal && (
        <div className="dash-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}>
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h2>{editingCategory ? "Edit Category" : "Add Category"}</h2>
              <button className="dash-modal-close" onClick={() => setShowCategoryModal(false)} type="button"><X size={20} /></button>
            </div>
            <div className="dash-modal-body">
              {categoryFormError && <div className="dash-form-error"><AlertCircle size={16} /><span>{categoryFormError}</span></div>}
              <div className="dash-form-group">
                <label>Name *</label>
                <input type="text" placeholder="e.g., Appetizers" value={categoryFormName} onChange={(e) => setCategoryFormName(e.target.value)} className="dash-form-input" autoFocus />
              </div>
              <div className="dash-form-group">
                <label>Description</label>
                <textarea placeholder="Brief description" value={categoryFormDescription} onChange={(e) => setCategoryFormDescription(e.target.value)} className="dash-form-textarea" rows={2} />
              </div>
              {locations.length > 0 && (
                <div className="dash-form-group">
                  <label>Location</label>
                  <select value={categoryFormLocationId} onChange={(e) => setCategoryFormLocationId(e.target.value)} className="dash-form-input">
                    <option value="">All</option>
                    {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn-secondary" onClick={() => setShowCategoryModal(false)} type="button">Cancel</button>
              <button className="dash-btn-primary" onClick={handleSaveCategory} disabled={savingCategory} type="button">
                {savingCategory ? <><Loader2 size={16} className="spinning" />Saving...</> : <><Plus size={16} />{editingCategory ? "Update" : "Add"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="dash-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLocationModal(false); }}>
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h2>{editingLocation ? "Edit Location" : "Add Location"}</h2>
              <button className="dash-modal-close" onClick={() => setShowLocationModal(false)} type="button"><X size={20} /></button>
            </div>
            <div className="dash-modal-body">
              {locationFormError && <div className="dash-form-error"><AlertCircle size={16} /><span>{locationFormError}</span></div>}
              <div className="dash-form-group">
                <label>Name *</label>
                <input type="text" placeholder="e.g., Main Branch" value={locationFormName} onChange={(e) => setLocationFormName(e.target.value)} className="dash-form-input" autoFocus />
              </div>
              <div className="dash-form-group">
                <label>Address</label>
                <input type="text" placeholder="Street address" value={locationFormAddress} onChange={(e) => setLocationFormAddress(e.target.value)} className="dash-form-input" />
              </div>
              <div className="dash-form-group">
                <label>Phone</label>
                <input type="text" placeholder="Phone" value={locationFormPhone} onChange={(e) => setLocationFormPhone(e.target.value)} className="dash-form-input" />
              </div>
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn-secondary" onClick={() => setShowLocationModal(false)} type="button">Cancel</button>
              <button className="dash-btn-primary" onClick={handleSaveLocation} disabled={savingLocation} type="button">
                {savingLocation ? <><Loader2 size={16} className="spinning" />Saving...</> : <><Plus size={16} />{editingLocation ? "Update" : "Add"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="dash-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowScheduleModal(false); }}>
          <div className="dash-modal">
            <div className="dash-modal-header">
              <h2>Add Schedule</h2>
              <button className="dash-modal-close" onClick={() => setShowScheduleModal(false)} type="button"><X size={20} /></button>
            </div>
            <div className="dash-modal-body">
              {scheduleFormError && <div className="dash-form-error"><AlertCircle size={16} /><span>{scheduleFormError}</span></div>}

              <div className="dash-form-group">
                <label>Schedule Name *</label>
                <input type="text" placeholder="e.g., Weekend Switch" value={scheduleFormName} onChange={(e) => setScheduleFormName(e.target.value)} className="dash-form-input" autoFocus />
              </div>

              <div className="dash-form-group">
                <label>Description</label>
                <input type="text" placeholder="Optional description" value={scheduleFormDescription} onChange={(e) => setScheduleFormDescription(e.target.value)} className="dash-form-input" />
              </div>

              <div className="dash-form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" value={scheduleFormScheduledAt} onChange={(e) => setScheduleFormScheduledAt(e.target.value)} className="dash-form-input" />
              </div>

              <div className="dash-form-group">
                <label>Action *</label>
                <select value={scheduleFormAction} onChange={(e) => setScheduleFormAction(e.target.value)} className="dash-form-input">
                  <option value="TOGGLE_ITEM_STATUS">Toggle Item Status (Available ↔ Sold Out)</option>
                  <option value="TOGGLE_ITEM_POPULAR">Toggle Popular Mark</option>
                  <option value="UPDATE_ITEM_PRICE">Update Item Price</option>
                </select>
              </div>

              <div className="dash-form-group">
                <label>Select Item *</label>
                <select
                  value={scheduleFormItemId}
                  onChange={(e) => setScheduleFormItemId(e.target.value)}
                  className="dash-form-input"
                >
                  <option value="">Choose an item...</option>
                  {menuItems
                    .filter(item => item.status === 'available')
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - NPR {item.price}
                      </option>
                    ))}
                </select>
              </div>

              {scheduleFormAction === 'UPDATE_ITEM_PRICE' && (
                <div className="dash-form-group">
                  <label>New Price (NPR) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={scheduleFormNewPrice}
                    onChange={(e) => setScheduleFormNewPrice(e.target.value)}
                    className="dash-form-input"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {scheduleFormItemId && scheduleFormAction === 'UPDATE_ITEM_PRICE' && (
                <div className="dash-schedule-preview">
                  <p className="dash-schedule-preview-label">Preview</p>
                  <p className="dash-schedule-preview-text">
                    On <strong>{scheduleFormScheduledAt ? new Date(scheduleFormScheduledAt).toLocaleString() : '...'}</strong>,
                    the price of <strong>{menuItems.find(i => i.id === scheduleFormItemId)?.name || 'selected item'}</strong>
                    will be updated to <strong>NPR {scheduleFormNewPrice || '...'}</strong>
                  </p>
                </div>
              )}

              {scheduleFormItemId && scheduleFormAction === 'TOGGLE_ITEM_STATUS' && (
                <div className="dash-schedule-preview">
                  <p className="dash-schedule-preview-label">Preview</p>
                  <p className="dash-schedule-preview-text">
                    On <strong>{scheduleFormScheduledAt ? new Date(scheduleFormScheduledAt).toLocaleString() : '...'}</strong>,
                    the status of <strong>{menuItems.find(i => i.id === scheduleFormItemId)?.name || 'selected item'}</strong>
                    will be toggled
                  </p>
                </div>
              )}

              {scheduleFormItemId && scheduleFormAction === 'TOGGLE_ITEM_POPULAR' && (
                <div className="dash-schedule-preview">
                  <p className="dash-schedule-preview-label">Preview</p>
                  <p className="dash-schedule-preview-text">
                    On <strong>{scheduleFormScheduledAt ? new Date(scheduleFormScheduledAt).toLocaleString() : '...'}</strong>,
                    the popular mark of <strong>{menuItems.find(i => i.id === scheduleFormItemId)?.name || 'selected item'}</strong>
                    will be toggled
                  </p>
                </div>
              )}
            </div>
            <div className="dash-modal-footer">
              <button className="dash-btn-secondary" onClick={() => setShowScheduleModal(false)} type="button">Cancel</button>
              <button className="dash-btn-primary" onClick={handleSaveSchedule} disabled={savingSchedule} type="button">
                {savingSchedule ? <><Loader2 size={16} className="spinning" />Saving...</> : <><Plus size={16} />Create Schedule</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="dash-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="dash-confirm-modal">
            <div className="dash-confirm-header">
              <div className="dash-confirm-icon-wrap"><AlertCircle size={22} /></div>
              <h2 className="dash-confirm-title">{confirmConfig.title}</h2>
              <button className="dash-modal-close" onClick={() => setShowConfirm(false)} type="button"><X size={18} /></button>
            </div>
            <div className="dash-confirm-body">
              <p className="dash-confirm-message">{confirmConfig.message}</p>
            </div>
            <div className="dash-confirm-footer">
              <button className="dash-btn-secondary" onClick={() => setShowConfirm(false)} type="button">Cancel</button>
              <button className={`dash-confirm-btn ${confirmConfig.confirmVariant}`} onClick={confirmConfig.onConfirm} type="button">
                {confirmConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}