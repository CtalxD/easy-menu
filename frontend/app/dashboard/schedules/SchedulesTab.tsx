//frontend/app/dashboard/schedules/SchedulesTab.tsx
"use client";

import { Plus, Trash2, Clock3, Crown, ArrowRight, Loader2, CheckCircle, XCircle, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import "./schedules.css";

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

interface SchedulesTabProps {
  schedules: Schedule[];
  menuItems: MenuItem[];
  isProOrAbove: boolean;
  savingSchedule: boolean;
  navigateToMembership: () => void;
  openAddSchedule: () => void;
  handleDeleteSchedule: (id: string) => void;
  refreshAllData?: () => Promise<void>;
}

export default function SchedulesTab({
  schedules,
  menuItems,
  isProOrAbove,
  savingSchedule,
  navigateToMembership,
  openAddSchedule,
  handleDeleteSchedule,
  refreshAllData,
}: SchedulesTabProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh schedules every 30 seconds to show updated statuses
  useEffect(() => {
    if (!isProOrAbove) return;

    intervalRef.current = setInterval(() => {
      if (refreshAllData) {
        refreshAllData();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isProOrAbove, refreshAllData]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatAppliedDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'TOGGLE_ITEM_STATUS': return 'Toggle Status';
      case 'UPDATE_ITEM_PRICE': return 'Update Price';
      case 'TOGGLE_ITEM_POPULAR': return 'Toggle Popular';
      case 'BULK_UPDATE': return 'Bulk Update';
      default: return action;
    }
  };

  if (!isProOrAbove) {
    return (
      <div className="schedules-tab">
        <div className="dash-analytics-upgrade">
          <div className="dash-analytics-upgrade-card">
            <div className="dash-analytics-upgrade-icon"><Clock3 size={48} /></div>
            <h1 className="dash-page-title">Scheduling</h1>
            <p className="dash-page-desc">Available on <strong>Pro</strong> plan.</p>
            <button className="dash-btn-upgrade" onClick={navigateToMembership} type="button"><Crown size={16} /> Upgrade <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schedules-tab">
      <div className="dash-section-header">
        <div>
          <h1 className="dash-page-title">Schedules</h1>
          <p className="dash-page-desc">Automated menu changes</p>
        </div>
        <button className="dash-btn-primary" onClick={openAddSchedule} disabled={savingSchedule} type="button">
          {savingSchedule ? <Loader2 size={16} className="spinning" /> : <Plus size={16} />} Add
        </button>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Action</th>
              <th>Scheduled For</th>
              <th>Status</th>
              <th>Applied At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((sched) => {
              let payload: any = {};
              try {
                payload = JSON.parse(sched.payload);
              } catch (e) {}

              const scheduledItem = menuItems.find((item) => item.id === payload.itemId);

              return (
                <tr key={sched.id}>
                  <td>
                    <div className="dash-item-name-cell">
                      <strong>{sched.name}</strong>
                      {scheduledItem && <span className="text-muted">{scheduledItem.name}</span>}
                    </div>
                  </td>
                  <td><span className="dash-status available">{getActionLabel(sched.action)}</span></td>
                  <td>{formatDateTime(sched.scheduledAt)}</td>
                  <td>
                    <span className={`dash-status ${sched.status === 'pending' ? 'available' : 'sold_out'}`}>
                      {sched.status === 'pending' ? 'Pending' : 'Applied'}
                    </span>
                  </td>
                  <td>{sched.appliedAt ? formatAppliedDateTime(sched.appliedAt) : '-'}</td>
                  <td>
                    {sched.status === 'pending' && (
                      <button className="dash-icon-btn dash-delete-btn" onClick={() => handleDeleteSchedule(sched.id)} type="button">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {schedules.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No schedules yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}