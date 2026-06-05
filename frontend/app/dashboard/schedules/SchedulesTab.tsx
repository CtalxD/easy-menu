"use client";

import { Plus, Trash2, Clock3, Crown, ArrowRight, Loader2 } from "lucide-react";
import "./schedules.css";

interface SchedulesTabProps {
  schedules: any[];
  isProOrAbove: boolean;
  savingSchedule: boolean;
  navigateToMembership: () => void;
  openAddSchedule: () => void;
  handleDeleteSchedule: (id: string) => void;
}

export default function SchedulesTab({
  schedules,
  isProOrAbove,
  savingSchedule,
  navigateToMembership,
  openAddSchedule,
  handleDeleteSchedule,
}: SchedulesTabProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
          <thead><tr><th>Name</th><th>Action</th><th>When</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {schedules.map((sched: any) => (
              <tr key={sched.id}>
                <td><div className="dash-item-name-cell">{sched.name}</div></td>
                <td><span className="dash-status available">{sched.action}</span></td>
                <td>{formatDateTime(sched.scheduledAt)}</td>
                <td><span className={`dash-status ${sched.status === 'pending' ? 'available' : 'sold_out'}`}>{sched.status}</span></td>
                <td><button className="dash-icon-btn dash-delete-btn" onClick={() => handleDeleteSchedule(sched.id)} type="button"><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>No schedules yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}