//frontend/app/dashboard/categories/CategoriesTab.tsx
"use client";

import { Plus, Edit3, Trash2, Zap, LayoutDashboard, Loader2, Trash } from "lucide-react";
import "./categories.css";

interface CategoriesTabProps {
  categories: any[];
  menuItems: any[];
  defaultCategories: string[];
  isCategoryLimitReached: boolean;
  initializingCategories: boolean;
  deletingAll: boolean;
  openAddCategory: () => void;
  openEditCategory: (cat: any) => void;
  handleDeleteCategory: (id: string) => void;
  handleDeleteAllCategories: () => void;
  handleLoadDefaultCategories: () => void;
}

export default function CategoriesTab({
  categories,
  menuItems,
  defaultCategories,
  isCategoryLimitReached,
  initializingCategories,
  deletingAll,
  openAddCategory,
  openEditCategory,
  handleDeleteCategory,
  handleDeleteAllCategories,
  handleLoadDefaultCategories,
}: CategoriesTabProps) {
  return (
    <div className="categories-tab">
      <div className="dash-section-header">
        <div>
          <h1 className="dash-page-title">Categories</h1>
          <p className="dash-page-desc">{categories.length} of {isCategoryLimitReached ? categories.length : '20'} used</p>
        </div>
        <div className="dash-categories-all-actions">
          <button className="dash-btn-secondary" onClick={handleLoadDefaultCategories} disabled={initializingCategories || isCategoryLimitReached || defaultCategories.length === 0} type="button">
            {initializingCategories ? <Loader2 size={16} className="spinning" /> : <Zap size={16} />}
            Load Default
          </button>
          <button className="dash-btn-primary" onClick={openAddCategory} disabled={isCategoryLimitReached} type="button">
            <Plus size={16} /> Add
          </button>
          {categories.length > 0 && (
            <button className="dash-btn-danger" onClick={handleDeleteAllCategories} disabled={deletingAll} type="button">
              {deletingAll ? <Loader2 size={16} className="spinning" /> : <Trash size={16} />}
              <span>{deletingAll ? "Deleting..." : "Delete All"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="dash-categories-grid">
        {categories.map((cat: any) => (
          <div key={cat.id} className="dash-category-card">
            <div className="dash-category-info">
              <h3>{cat.name}</h3>
              <p>{menuItems.filter((i: any) => i.categoryId === cat.id).length} items</p>
            </div>
            <div className="dash-category-actions">
              <button className="dash-icon-btn" onClick={() => openEditCategory(cat)} type="button"><Edit3 size={14} /></button>
              <button className="dash-icon-btn dash-delete-btn" onClick={() => handleDeleteCategory(cat.id)} type="button"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="dash-empty-state">
            <LayoutDashboard size={48} />
            <h3>No categories</h3>
            <p>Load defaults or create your own.</p>
            <button className="dash-btn-primary" onClick={handleLoadDefaultCategories} disabled={isCategoryLimitReached} type="button">
              <Zap size={16} /> Load Defaults
            </button>
          </div>
        )}
      </div>
    </div>
  );
}