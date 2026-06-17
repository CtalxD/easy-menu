// admin/app/dashboard/menu-management/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, Search, RefreshCw, Edit2, Trash2, Plus, Save,
  CheckCircle, AlertTriangle, XCircle, Star, Zap,
  Crown, Building2, X, Tag,
  Package, ImageIcon, Menu, ChevronDown, Camera, Loader2,
  Eye, EyeOff
} from "lucide-react";
import "./menu-management.css";

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface Restaurant {
  id: string;
  name: string;
  plan: string;
  owner: Owner;
}

interface MenuItemType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  status: string;
  popular: boolean;
  category: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  restaurantId: string;
}

interface CategoryType {
  id: string;
  name: string;
  description: string | null;
  _count?: { menuItems: number };
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case "FREE": return "#999";
    case "STARTER": return "#4A6FA5";
    case "PRO": return "#6B4E9B";
    case "ENTERPRISE": return "#B8803E";
    default: return "#666";
  }
}

export default function MenuManagementPage() {
  const router = useRouter();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItemType | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryType | null>(null);
  
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const getToken = () => localStorage.getItem("adminToken") || "";

  const fetchRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const token = getToken();
      const usersRes = await fetch(`${API_URL}/api/admin/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      
      if (!usersRes.ok) throw new Error("Failed to fetch restaurants");
      
      const usersData = await usersRes.json();
      const users = usersData.users || usersData;
      
      const allRestaurants: Restaurant[] = [];
      users.forEach((user: any) => {
        if (user.restaurants) {
          user.restaurants.forEach((rest: any) => {
            allRestaurants.push({
              id: rest.id,
              name: rest.name,
              plan: rest.plan || "FREE",
              owner: {
                id: user.id,
                name: user.name,
                email: user.email,
              },
            });
          });
        }
      });
      
      setRestaurants(allRestaurants);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!itemImageFile) return null;
    setUploadingImage(true);
    try {
      const token = getToken();
      if (!token) {
        setError("Session expired — please log in again.");
        setTimeout(() => setError(""), 5000);
        return null;
      }

      const formData = new FormData();
      formData.append('image', itemImageFile);

      const response = await fetch(`${API_URL}/api/menu/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess("Image uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
        return data.imageUrl as string;
      } else {
        let errorMessage = "Image upload failed";
        try { 
          const errorData = await response.json(); 
          errorMessage = errorData.message || errorMessage; 
        } catch {}
        console.error("Upload failed:", response.status, errorMessage);
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
        return null;
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setError("Image upload failed — check your connection.");
      setTimeout(() => setError(""), 5000);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const selectRestaurant = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantDropdown(false);
    setRestaurantSearch("");
    setMenuLoading(true);
    setMenuItems([]);
    setCategories([]);
    setExpandedCategories(new Set());
    setSearchQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setEditingItem(null);
    setEditingCategory(null);
    setIsNewItem(false);
    setIsNewCategory(false);
    setItemImageFile(null);
    setItemImagePreview(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/restaurants/${restaurant.id}/menu`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.menuItems || []);
        const cats = data.categories || [];
        setCategories(cats);
        setExpandedCategories(new Set(cats.map((c: CategoryType) => c.id)));
      } else {
        const publicRes = await fetch(`${API_URL}/api/public/menu/${restaurant.id}`);
        if (publicRes.ok) {
          const data = await publicRes.json();
          const items: MenuItemType[] = [];
          const cats: CategoryType[] = [];
          if (data.menu?.categories) {
            data.menu.categories.forEach((cat: any) => {
              cats.push({
                id: cat.id,
                name: cat.name,
                description: cat.description || null,
                _count: { menuItems: cat.items?.length || 0 },
              });
              cat.items?.forEach((item: any) => {
                items.push({
                  id: item.id,
                  name: item.name,
                  description: item.description || null,
                  price: item.price || 0,
                  image: item.image || null,
                  status: item.status || 'available',
                  popular: item.popular || false,
                  category: { id: cat.id, name: cat.name },
                  location: null,
                  restaurantId: restaurant.id,
                });
              });
            });
          }
          if (data.menu?.uncategorized) {
            data.menu.uncategorized.forEach((item: any) => {
              items.push({
                id: item.id,
                name: item.name,
                description: item.description || null,
                price: item.price || 0,
                image: item.image || null,
                status: item.status || 'available',
                popular: item.popular || false,
                category: null,
                location: null,
                restaurantId: restaurant.id,
              });
            });
          }
          setMenuItems(items);
          setCategories(cats);
          setExpandedCategories(new Set(cats.map((c: CategoryType) => c.id)));
        }
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const saveMenuItem = async () => {
    if (!editingItem || !selectedRestaurant) return;
    setSaving(true);
    setError("");
    try {
      const token = getToken();
      
      let imageUrl: string | null = editingItem.image;
      if (itemImageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSaving(false);
          return;
        }
      } else if (!itemImagePreview && editingItem.image) {
        imageUrl = null;
      }

      const url = isNewItem
        ? `${API_URL}/api/admin/restaurants/${selectedRestaurant.id}/menu-items`
        : `${API_URL}/api/admin/menu-items/${editingItem.id}`;
      const method = isNewItem ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editingItem.name,
          description: editingItem.description || "",
          price: editingItem.price,
          categoryId: editingItem.category?.id || null,
          status: editingItem.status,
          popular: editingItem.popular,
          image: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save item");
      }

      setSuccess(isNewItem ? "Menu item created" : "Menu item updated");
      setTimeout(() => setSuccess(""), 3000);
      setEditingItem(null);
      setIsNewItem(false);
      setItemImageFile(null);
      setItemImagePreview(null);
      selectRestaurant(selectedRestaurant);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const deleteMenuItem = async () => {
    if (!deletingItem || !selectedRestaurant) return;
    setSaving(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/menu-items/${deletingItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete item");
      }
      setSuccess("Menu item deleted");
      setTimeout(() => setSuccess(""), 3000);
      setDeletingItem(null);
      selectRestaurant(selectedRestaurant);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!editingCategory || !selectedRestaurant) return;
    setSaving(true);
    setError("");
    try {
      const token = getToken();
      const url = isNewCategory
        ? `${API_URL}/api/admin/restaurants/${selectedRestaurant.id}/categories`
        : `${API_URL}/api/admin/categories/${editingCategory.id}`;
      const method = isNewCategory ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editingCategory.name, description: editingCategory.description || "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save category");
      }
      setSuccess(isNewCategory ? "Category created" : "Category updated");
      setTimeout(() => setSuccess(""), 3000);
      setEditingCategory(null);
      setIsNewCategory(false);
      selectRestaurant(selectedRestaurant);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!deletingCategory || !selectedRestaurant) return;
    setSaving(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete category");
      }
      setSuccess("Category deleted");
      setTimeout(() => setSuccess(""), 3000);
      setDeletingCategory(null);
      selectRestaurant(selectedRestaurant);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || 
      (categoryFilter === "UNCATEGORIZED" && !item.category) ||
      item.category?.id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const groupedItems = categories.map(cat => ({
    category: cat,
    items: filteredMenuItems.filter(item => item.category?.id === cat.id),
  })).filter(g => g.items.length > 0);

  const uncategorizedItems = filteredMenuItems.filter(item => !item.category);

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
    r.owner.name.toLowerCase().includes(restaurantSearch.toLowerCase())
  );

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(i => i.status === 'available').length;
  const soldOutItems = menuItems.filter(i => i.status === 'sold_out').length;
  const popularItems = menuItems.filter(i => i.popular).length;

  return (
    <div className="menu-management-page">
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>&times;</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError("")}>&times;</button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Menu Management</h1>
          <p className="page-subtitle">Select a restaurant to manage its menu items and categories</p>
        </div>
      </div>

      {/* Restaurant Selector */}
      <div className="restaurant-selector">
        <label>Select Restaurant</label>
        <div className="restaurant-select-wrapper">
          <div 
            className="restaurant-select-input"
            onClick={() => setShowRestaurantDropdown(!showRestaurantDropdown)}
          >
            {selectedRestaurant ? (
              <div className="selected-restaurant">
                <div className="selected-rest-avatar" style={{ background: getPlanColor(selectedRestaurant.plan) }}>
                  {selectedRestaurant.name.charAt(0).toUpperCase()}
                </div>
                <div className="selected-rest-info">
                  <span className="selected-rest-name">{selectedRestaurant.name}</span>
                  <span className="selected-rest-owner">{selectedRestaurant.owner.name} • {selectedRestaurant.owner.email}</span>
                </div>
                <span className={`plan-badge-sm plan-badge-${selectedRestaurant.plan.toLowerCase()}`}>
                  {selectedRestaurant.plan}
                </span>
              </div>
            ) : (
              <span className="restaurant-select-placeholder">Choose a restaurant...</span>
            )}
            <ChevronDown size={18} className={`select-chevron ${showRestaurantDropdown ? 'rotate' : ''}`} />
          </div>
          {showRestaurantDropdown && (
            <div className="restaurant-dropdown">
              <div className="restaurant-dropdown-search">
                <Search size={14} />
                <input type="text" placeholder="Search restaurants..." value={restaurantSearch} onChange={(e) => setRestaurantSearch(e.target.value)} autoFocus />
              </div>
              <div className="restaurant-dropdown-list">
                {filteredRestaurants.length === 0 ? (
                  <div className="restaurant-dropdown-empty">No restaurants found</div>
                ) : (
                  filteredRestaurants.map(rest => (
                    <div key={rest.id} className={`restaurant-dropdown-item ${selectedRestaurant?.id === rest.id ? 'active' : ''}`} onClick={() => selectRestaurant(rest)}>
                      <div className="dropdown-rest-avatar" style={{ background: getPlanColor(rest.plan) }}>{rest.name.charAt(0).toUpperCase()}</div>
                      <div className="dropdown-rest-info">
                        <span className="dropdown-rest-name">{rest.name}</span>
                        <span className="dropdown-rest-owner">{rest.owner.name} • {rest.owner.email}</span>
                      </div>
                      <span className={`plan-badge-sm plan-badge-${rest.plan.toLowerCase()}`}>{rest.plan}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {selectedRestaurant && (
          <button className="btn-secondary" onClick={() => selectRestaurant(selectedRestaurant)} disabled={menuLoading}>
            <RefreshCw size={14} className={menuLoading ? "spin" : ""} /> Refresh
          </button>
        )}
      </div>

      {/* Menu Content */}
      {selectedRestaurant ? (
        <>
          {/* Stats Bar */}
          <div className="menu-stats-bar">
            <div className="menu-stat-item"><span className="menu-stat-value">{totalItems}</span><span className="menu-stat-label">Total Items</span></div>
            <div className="menu-stat-item"><span className="menu-stat-value menu-stat-green">{availableItems}</span><span className="menu-stat-label">Available</span></div>
            <div className="menu-stat-item"><span className="menu-stat-value menu-stat-red">{soldOutItems}</span><span className="menu-stat-label">Sold Out</span></div>
            <div className="menu-stat-item"><span className="menu-stat-value menu-stat-amber">{popularItems}</span><span className="menu-stat-label">Popular</span></div>
            <div className="menu-stat-item"><span className="menu-stat-value">{categories.length}</span><span className="menu-stat-label">Categories</span></div>
          </div>

          {/* Toolbar */}
          <div className="menu-toolbar">
            <div className="toolbar-left">
              <div className="search-box" style={{ width: 280 }}>
                <Search size={14} />
                <input type="text" placeholder="Search menu items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}>&times;</button>}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select-sm">
                <option value="ALL">All Status</option>
                <option value="available">Available</option>
                <option value="sold_out">Sold Out</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select-sm">
                <option value="ALL">All Categories</option>
                <option value="UNCATEGORIZED">Uncategorized</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="toolbar-right">
              <button className="btn-secondary btn-sm" onClick={() => { setIsNewCategory(true); setEditingCategory({ id: '', name: '', description: '' }); }}>
                <Plus size={14} /> Category
              </button>
              <button className="btn-save btn-sm" onClick={() => {
                setIsNewItem(true);
                setEditingItem({ id: '', name: '', description: '', price: 0, image: null, status: 'available', popular: false, category: null, location: null, restaurantId: selectedRestaurant.id });
                setItemImageFile(null); setItemImagePreview(null);
              }}>
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>

          {/* Menu Items */}
          {menuLoading ? (
            <div className="menu-loading"><Loader2 size={32} className="spin" /><p>Loading menu items...</p></div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="menu-empty">
              <Package size={56} />
              <h3>No menu items found</h3>
              <p>{searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" ? "Try adjusting your filters." : "Start by adding menu items to this restaurant."}</p>
              {!searchQuery && statusFilter === "ALL" && categoryFilter === "ALL" && (
                <button className="btn-save" style={{ marginTop: 20 }} onClick={() => {
                  setIsNewItem(true);
                  setEditingItem({ id: '', name: '', description: '', price: 0, image: null, status: 'available', popular: false, category: null, location: null, restaurantId: selectedRestaurant.id });
                  setItemImageFile(null); setItemImagePreview(null);
                }}>
                  <Plus size={16} /> Add First Item
                </button>
              )}
            </div>
          ) : (
            <div className="menu-sections">
              {groupedItems.map(({ category, items }) => (
                <div key={category.id} className="menu-section">
                  <div className="menu-section-header" onClick={() => toggleCategory(category.id)}>
                    <div className="menu-section-header-left">
                      <ChevronDown size={18} className={`section-chevron ${expandedCategories.has(category.id) ? 'expanded' : ''}`} />
                      <div className="section-category-icon"><Tag size={16} /></div>
                      <div className="section-category-info">
                        <span className="section-category-name">{category.name}</span>
                        {category.description && <span className="section-category-desc">{category.description}</span>}
                      </div>
                    </div>
                    <div className="menu-section-header-right">
                      <span className="section-item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                      <div className="section-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon-sm" onClick={() => setEditingCategory(category)} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn-icon-sm btn-icon-danger" onClick={() => setDeletingCategory(category)} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                  {expandedCategories.has(category.id) && (
                    <div className="menu-section-body">
                      <table className="menu-table">
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}></th>
                            <th>Name</th>
                            <th style={{ width: 130 }}>Price</th>
                            <th style={{ width: 120 }}>Status</th>
                            <th style={{ width: 90 }}>Popular</th>
                            <th style={{ width: 110 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} className="menu-table-row">
                              <td>
                                <div className="table-item-image">
                                  {item.image ? <img src={item.image} alt={item.name} /> : <div className="table-item-image-placeholder"><ImageIcon size={14} /></div>}
                                </div>
                              </td>
                              <td>
                                <div className="table-item-info">
                                  <span className="table-item-name">{item.name}</span>
                                  {item.description && <span className="table-item-desc">{item.description}</span>}
                                </div>
                              </td>
                              <td><span className="table-item-price">{formatPrice(item.price)}</span></td>
                              <td>
                                <span className={`status-badge ${item.status}`}>
                                  {item.status === 'available' ? <><Eye size={10} /> Available</> : <><EyeOff size={10} /> Sold Out</>}
                                </span>
                              </td>
                              <td>{item.popular ? <Star size={16} className="popular-star" /> : <span className="text-na">—</span>}</td>
                              <td>
                                <div className="table-actions">
                                  <button className="btn-icon-sm" onClick={() => { setEditingItem(item); setIsNewItem(false); setItemImageFile(null); setItemImagePreview(item.image || null); }} title="Edit"><Edit2 size={13} /></button>
                                  <button className="btn-icon-sm btn-icon-danger" onClick={() => setDeletingItem(item)} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {uncategorizedItems.length > 0 && (
                <div className="menu-section">
                  <div className="menu-section-header" style={{ cursor: 'default' }}>
                    <div className="menu-section-header-left">
                      <div className="section-category-icon" style={{ background: '#F5F5F5', color: '#999' }}><Tag size={16} /></div>
                      <div className="section-category-info">
                        <span className="section-category-name">Uncategorized</span>
                        <span className="section-category-desc">Items without a category</span>
                      </div>
                    </div>
                    <span className="section-item-count">{uncategorizedItems.length} {uncategorizedItems.length === 1 ? 'item' : 'items'}</span>
                  </div>
                  <div className="menu-section-body">
                    <table className="menu-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}></th>
                          <th>Name</th>
                          <th style={{ width: 130 }}>Price</th>
                          <th style={{ width: 120 }}>Status</th>
                          <th style={{ width: 90 }}>Popular</th>
                          <th style={{ width: 110 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uncategorizedItems.map(item => (
                          <tr key={item.id} className="menu-table-row">
                            <td>
                              <div className="table-item-image">
                                {item.image ? <img src={item.image} alt={item.name} /> : <div className="table-item-image-placeholder"><ImageIcon size={14} /></div>}
                              </div>
                            </td>
                            <td>
                              <div className="table-item-info">
                                <span className="table-item-name">{item.name}</span>
                                {item.description && <span className="table-item-desc">{item.description}</span>}
                              </div>
                            </td>
                            <td><span className="table-item-price">{formatPrice(item.price)}</span></td>
                            <td>
                              <span className={`status-badge ${item.status}`}>
                                {item.status === 'available' ? <><Eye size={10} /> Available</> : <><EyeOff size={10} /> Sold Out</>}
                              </span>
                            </td>
                            <td>{item.popular ? <Star size={16} className="popular-star" /> : <span className="text-na">—</span>}</td>
                            <td>
                              <div className="table-actions">
                                <button className="btn-icon-sm" onClick={() => { setEditingItem(item); setIsNewItem(false); setItemImageFile(null); setItemImagePreview(item.image || null); }} title="Edit"><Edit2 size={13} /></button>
                                <button className="btn-icon-sm btn-icon-danger" onClick={() => setDeletingItem(item)} title="Delete"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="select-restaurant-prompt">
          <div className="prompt-icon"><Menu size={56} /></div>
          <h2>Select a Restaurant</h2>
          <p>Choose a restaurant from the dropdown above to view and manage its menu items and categories.</p>
        </div>
      )}

      {/* Edit/Create Item Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => { setEditingItem(null); setIsNewItem(false); setItemImageFile(null); setItemImagePreview(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isNewItem ? 'Add Menu Item' : 'Edit Menu Item'}</h2>
              <button className="modal-close" onClick={() => { setEditingItem(null); setIsNewItem(false); setItemImageFile(null); setItemImagePreview(null); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Item name" />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea value={editingItem.description || ''} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} placeholder="Item description" rows={2} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Price (Rs.) *</label>
                  <input type="number" step="0.01" min="0" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <select value={editingItem.category?.id || ''} onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setEditingItem({ ...editingItem, category: cat ? { id: cat.id, name: cat.name } : null });
                  }}>
                    <option value="">Uncategorized</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Status</label>
                  <select value={editingItem.status} onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Popular</label>
                  <select value={editingItem.popular ? 'true' : 'false'} onChange={e => setEditingItem({ ...editingItem, popular: e.target.value === 'true' })}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Item Image</label>
                <div className="image-upload-container">
                  {itemImagePreview ? (
                    <div className="image-preview-wrap">
                      <img src={itemImagePreview} alt="Preview" className="image-preview-img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <button className="image-remove-btn" onClick={() => { setItemImageFile(null); setItemImagePreview(null); setEditingItem({ ...editingItem, image: null }); }} type="button"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) { setError("Image must be less than 5MB"); setTimeout(() => setError(""), 3000); return; }
                          setItemImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setItemImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} className="image-upload-input" id="menu-item-image-upload" />
                      <label htmlFor="menu-item-image-upload" className="image-upload-label">
                        <Camera size={24} />
                        <span>Click to upload image</span>
                        <span className="image-upload-hint">JPG, PNG, GIF up to 5MB</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setEditingItem(null); setIsNewItem(false); setItemImageFile(null); setItemImagePreview(null); }}>Cancel</button>
              <button className="btn-save" onClick={saveMenuItem} disabled={saving || uploadingImage || !editingItem.name.trim()}>
                {saving || uploadingImage ? <><Loader2 size={14} className="spin" /> {uploadingImage ? "Uploading..." : "Saving..."}</> : <><Save size={14} /> {isNewItem ? 'Create Item' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Category Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => { setEditingCategory(null); setIsNewCategory(false); }}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isNewCategory ? 'Add Category' : 'Edit Category'}</h2>
              <button className="modal-close" onClick={() => { setEditingCategory(null); setIsNewCategory(false); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Category Name *</label>
                <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} placeholder="Category name" />
              </div>
              <div className="form-field">
                <label>Description (optional)</label>
                <input type="text" value={editingCategory.description || ''} onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })} placeholder="Category description" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setEditingCategory(null); setIsNewCategory(false); }}>Cancel</button>
              <button className="btn-save" onClick={saveCategory} disabled={saving || !editingCategory.name.trim()}>
                {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Save size={14} /> {isNewCategory ? 'Create Category' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {deletingItem && (
        <div className="modal-overlay" onClick={() => setDeletingItem(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><AlertTriangle size={18} className="modal-warning-icon" /> Delete Menu Item</h2>
              <button className="modal-close" onClick={() => setDeletingItem(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this menu item?</p>
              <div className="delete-target"><strong>{deletingItem.name}</strong><span className="delete-target-type">menu item</span></div>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeletingItem(null)}>Cancel</button>
              <button className="btn-delete" onClick={deleteMenuItem} disabled={saving}>
                {saving ? <><Loader2 size={14} className="spin" /> Deleting...</> : <><Trash2 size={14} /> Delete Item</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deletingCategory && (
        <div className="modal-overlay" onClick={() => setDeletingCategory(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><AlertTriangle size={18} className="modal-warning-icon" /> Delete Category</h2>
              <button className="modal-close" onClick={() => setDeletingCategory(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this category?</p>
              <div className="delete-target"><strong>{deletingCategory.name}</strong><span className="delete-target-type">category</span></div>
              <div className="delete-info"><AlertTriangle size={14} /><span>Items in this category will become uncategorized.</span></div>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeletingCategory(null)}>Cancel</button>
              <button className="btn-delete" onClick={deleteCategory} disabled={saving}>
                {saving ? <><Loader2 size={14} className="spin" /> Deleting...</> : <><Trash2 size={14} /> Delete Category</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}   