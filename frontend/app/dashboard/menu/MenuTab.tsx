"use client";

import { Plus, Edit3, Star, Trash2, Camera, CheckCircle, XCircle, Package, Loader2, Trash } from "lucide-react";
import "./menu.css";

interface MenuTabProps {
  menuItems: any[];
  categories: any[];
  searchQuery: string;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isItemLimitReached: boolean;
  deletingAll: boolean;
  openAddItem: () => void;
  openEditItem: (item: any) => void;
  handleDeleteItem: (id: string) => void;
  handleDeleteAllItems: () => void;
  handleToggleStatus: (id: string) => void;
  handleTogglePopular: (id: string) => void;
}

export default function MenuTab({
  menuItems,
  categories,
  searchQuery,
  selectedCategory,
  setSelectedCategory,
  isItemLimitReached,
  deletingAll,
  openAddItem,
  openEditItem,
  handleDeleteItem,
  handleDeleteAllItems,
  handleToggleStatus,
  handleTogglePopular,
}: MenuTabProps) {
  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="menu-tab">
      <div className="dash-menu-header-row">
        <div className="dash-categories-filter">
          <button className={`dash-cat-btn ${selectedCategory === "all" ? "active" : ""}`} onClick={() => setSelectedCategory("all")} type="button">
            All ({menuItems.length})
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} className={`dash-cat-btn ${selectedCategory === cat.id ? "active" : ""}`} onClick={() => setSelectedCategory(cat.id)} type="button">
              {cat.name} ({menuItems.filter((i: any) => i.categoryId === cat.id).length})
            </button>
          ))}
        </div>
        <div className="dash-menu-actions-row">
          <button className="dash-btn-primary" onClick={openAddItem} disabled={isItemLimitReached} type="button" style={{ opacity: isItemLimitReached ? 0.5 : 1 }}>
            <Plus size={16} /><span>Add Item</span>
          </button>
          {menuItems.length > 0 && (
            <button className="dash-btn-danger" onClick={handleDeleteAllItems} disabled={deletingAll} type="button">
              {deletingAll ? <Loader2 size={16} className="spinning" /> : <Trash size={16} />}
              <span>{deletingAll ? "Deleting..." : "Delete All"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="dash-menu-grid">
        {filteredItems.map((item: any) => (
          <div key={item.id} className="dash-menu-card">
            <div className="dash-menu-card-img">
              {item.image ? <img src={item.image} alt={item.name} /> : <Camera size={32} />}
            </div>
            <div className="dash-menu-card-body">
              <div className="dash-menu-card-header">
                <h3>{item.name}</h3>
                {item.popular && <span className="dash-badge-popular">Popular</span>}
              </div>
              <p className="dash-menu-card-cat">{item.category?.name || "Uncategorized"}</p>
              {item.description && <p className="dash-menu-card-desc">{item.description}</p>}
              <div className="dash-menu-card-footer">
                <span className="dash-menu-card-price">NPR {item.price}</span>
                <button className={`dash-status-btn ${item.status}`} onClick={() => handleToggleStatus(item.id)} type="button">
                  {item.status === "available" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span className={`dash-status ${item.status}`}>{item.status === "available" ? "Available" : "Sold Out"}</span>
                </button>
              </div>
            </div>
            <div className="dash-menu-card-actions">
              <button className="dash-icon-btn" onClick={() => openEditItem(item)} type="button"><Edit3 size={14} /></button>
              <button className="dash-icon-btn" onClick={() => handleTogglePopular(item.id)} type="button">
                <Star size={14} fill={item.popular ? "#FFA726" : "none"} color={item.popular ? "#FFA726" : "currentColor"} />
              </button>
              <button className="dash-icon-btn dash-delete-btn" onClick={() => handleDeleteItem(item.id)} type="button"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="dash-empty-state">
            <Package size={48} />
            <h3>No items found</h3>
            <p>Add your first menu item.</p>
            <button className="dash-btn-primary" onClick={openAddItem} disabled={isItemLimitReached} type="button">
              <Plus size={16} /> Add Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}