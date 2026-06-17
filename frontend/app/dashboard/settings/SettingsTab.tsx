//frontend/app/dashboard/settings/SettingsTab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, X, CheckCircle } from "lucide-react";
import "./settings.css";

interface SettingsTabProps {
  user: any;
  getAccessToken: () => string | null;
  addToast: (type: "success" | "error" | "info", message: string, action?: { label: string; href: string }) => void;
  refreshAllData: () => Promise<void>;
  API_URL: string;
}

export default function SettingsTab({
  user,
  getAccessToken,
  addToast,
  refreshAllData,
  API_URL,
}: SettingsTabProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Get original values from user
  const originalName = user?.restaurant?.name || "";
  const originalDescription = user?.restaurant?.description || "";
  const originalPhone = user?.restaurant?.phone || "";
  const originalAddress = user?.restaurant?.address || "";

  // Load initial values whenever user data changes
  useEffect(() => {
    setName(originalName);
    setDescription(originalDescription);
    setPhone(originalPhone);
    setAddress(originalAddress);
    setEmail(user?.restaurant?.email || user?.email || "");
    setHasChanges(false);
    setSavedSuccess(false);
  }, [originalName, originalDescription, originalPhone, originalAddress, user?.restaurant?.email, user?.email]);

  // Track changes
  useEffect(() => {
    const changed = 
      name !== originalName ||
      description !== originalDescription ||
      phone !== originalPhone ||
      address !== originalAddress;
    
    setHasChanges(changed);
    
    if (changed) {
      setSavedSuccess(false);
    }
  }, [name, description, phone, address, originalName, originalDescription, originalPhone, originalAddress]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    
    try {
      const token = getAccessToken();
      if (!token) {
        addToast("error", "Please login again");
        return;
      }

      const response = await fetch(`${API_URL}/api/menu/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user object directly so changes reflect immediately
        if (user.restaurant) {
          user.restaurant.name = data.restaurant.name;
          user.restaurant.description = data.restaurant.description;
          user.restaurant.phone = data.restaurant.phone;
          user.restaurant.address = data.restaurant.address;
        }
        
        await refreshAllData();
        
        setHasChanges(false);
        setSavedSuccess(true);
        addToast("success", "Settings saved successfully!");
        
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const data = await response.json();
        addToast("error", data.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      addToast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setName(originalName);
    setDescription(originalDescription);
    setPhone(originalPhone);
    setAddress(originalAddress);
    setHasChanges(false);
    setSavedSuccess(false);
    addToast("info", "Changes discarded");
  };

  return (
    <div className="settings-tab">
      <div className="dash-settings-form">
        <div className="dash-settings-header">
          <div>
            <h2 className="dash-settings-title">Restaurant Settings</h2>
            <p className="dash-settings-desc">Manage your restaurant profile information</p>
          </div>
          <div className="dash-settings-header-badges">
            {savedSuccess && (
              <span className="dash-settings-badge dash-settings-badge-saved">
                <CheckCircle size={12} />
                Saved
              </span>
            )}
            {hasChanges && (
              <span className="dash-settings-badge dash-settings-badge-unsaved">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        <div className="dash-form-group">
          <label>Restaurant Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="dash-form-input"
          />
        </div>

        <div className="dash-form-group">
          <label>Description</label>
          <textarea
            placeholder="Brief description of your restaurant"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="dash-form-textarea"
            rows={3}
          />
        </div>

        <div className="dash-form-row">
          <div className="dash-form-group">
            <label>Phone</label>
            <input
              type="text"
              placeholder="Contact number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="dash-form-input"
            />
          </div>
          <div className="dash-form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              className="dash-form-input dash-form-input-disabled"
              disabled
              readOnly
            />
            <span className="dash-settings-hint">Email cannot be changed</span>
          </div>
        </div>

        <div className="dash-form-group">
          <label>Address</label>
          <input
            type="text"
            placeholder="Physical address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="dash-form-input"
          />
        </div>

        <div className="dash-settings-actions">
          {hasChanges && (
            <button
              className="dash-btn-secondary"
              onClick={handleDiscard}
              type="button"
              disabled={saving}
            >
              <X size={16} />
              Discard Changes
            </button>
          )}
          <button
            className="dash-btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            type="button"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spinning" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}