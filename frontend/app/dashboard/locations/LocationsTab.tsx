"use client";

import { Plus, Edit3, Trash2, MapPin, Crown, ArrowRight, Loader2 } from "lucide-react";
import "./locations.css";

interface LocationsTabProps {
  locations: any[];
  maxLocations: number;
  isProOrAbove: boolean;
  isLocationLimitReached: boolean;
  savingLocation: boolean;
  navigateToMembership: () => void;
  openAddLocation: () => void;
  openEditLocation: (loc: any) => void;
  handleDeleteLocation: (id: string) => void;
}

export default function LocationsTab({
  locations,
  maxLocations,
  isProOrAbove,
  isLocationLimitReached,
  savingLocation,
  navigateToMembership,
  openAddLocation,
  openEditLocation,
  handleDeleteLocation,
}: LocationsTabProps) {
  if (!isProOrAbove) {
    return (
      <div className="locations-tab">
        <div className="dash-analytics-upgrade">
          <div className="dash-analytics-upgrade-card">
            <div className="dash-analytics-upgrade-icon"><MapPin size={48} /></div>
            <h1 className="dash-page-title">Locations</h1>
            <p className="dash-page-desc">Available on <strong>Pro</strong> plan. Up to 5 locations.</p>
            <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button"><Crown size={16} /> Upgrade <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="locations-tab">
      <div className="dash-section-header">
        <div>
          <h1 className="dash-page-title">Locations</h1>
          <p className="dash-page-desc">{locations.length} of {maxLocations}</p>
        </div>
        <button className="dash-btn-primary" onClick={openAddLocation} disabled={isLocationLimitReached || savingLocation} type="button">
          {savingLocation ? <Loader2 size={16} className="spinning" /> : <Plus size={16} />} Add
        </button>
      </div>

      <div className="dash-locations-grid">
        {locations.map((loc: any) => (
          <div key={loc.id} className="dash-location-card">
            <div className="dash-location-info">
              <h3><MapPin size={16} /> {loc.name}</h3>
              {loc.address && <p>{loc.address}</p>}
              {loc.phone && <p>{loc.phone}</p>}
            </div>
            <div className="dash-location-actions">
              <button className="dash-icon-btn" onClick={() => openEditLocation(loc)} type="button"><Edit3 size={14} /></button>
              <button className="dash-icon-btn dash-delete-btn" onClick={() => handleDeleteLocation(loc.id)} type="button"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="dash-empty-state" style={{ gridColumn: '1 / -1' }}>
            <MapPin size={48} />
            <h3>No locations</h3>
            <p>Add your first location.</p>
          </div>
        )}
      </div>
    </div>
  );
}