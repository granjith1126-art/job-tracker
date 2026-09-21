import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import AddApplicationModal from '../components/AddApplicationModal';
import { api } from '../services/api';

export default function ApplicationTracker({ onApplicationChanged }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [applications, setApplications] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.applications.list();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAddApplication = async (newAppData) => {
    try {
      await api.applications.create(newAppData);
      fetchApplications();
      if (onApplicationChanged) onApplicationChanged();
    } catch (err) {
      console.error('Add app error:', err);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.applications.updateStatus(appId, newStatus);
      fetchApplications();
      if (onApplicationChanged) onApplicationChanged();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleDelete = async (appId) => {
    try {
      await api.applications.delete(appId);
      fetchApplications();
      if (onApplicationChanged) onApplicationChanged();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const counts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer: applications.filter(a => a.status === 'Offer').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'All') return true;
    return app.status?.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none text-slate-100">
      {/* View Header with Add Application Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Application Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">Track and manage your actual job applications in real time.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-glow px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-6 border-b border-white/10 pb-3 text-xs font-semibold">
        {[
          { id: 'All', label: `All (${counts.all})` },
          { id: 'Applied', label: `Applied (${counts.applied})` },
          { id: 'Interview', label: `Interview (${counts.interview})` },
          { id: 'Offer', label: `Offer (${counts.offer})` },
          { id: 'Rejected', label: `Rejected (${counts.rejected})` }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`pb-2 -mb-3 transition-colors cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Full-width Glass Data Table */}
      <div className="bg-[#0D132A]/70 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#070B1B]/80 text-xs font-bold text-slate-400 h-12">
                <th className="py-3 px-6 font-bold text-slate-300">Job Role</th>
                <th className="py-3 px-6 font-bold text-slate-300">Company</th>
                <th className="py-3 px-6 font-bold text-slate-300">Status</th>
                <th className="py-3 px-6 font-bold text-slate-300">Date Applied</th>
                <th className="py-3 px-6 font-bold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-medium text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-semibold">
                    Loading your applications...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-semibold">
                    {activeFilter === 'All' 
                      ? 'You have not submitted or tracked any job applications yet.'
                      : `No applications in the "${activeFilter}" stage.`}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="h-14 hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      {app.role}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-semibold">
                      {app.company}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={app.status} />
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="h-6 px-2 rounded-md text-[10px] font-semibold bg-[#070B1B] text-slate-300 border border-white/10 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                        >
                          <option value="Applied" className="bg-[#0B1024]">Applied</option>
                          <option value="Interview" className="bg-[#0B1024]">Interview</option>
                          <option value="Offer" className="bg-[#0B1024]">Offer</option>
                          <option value="Rejected" className="bg-[#0B1024]">Rejected</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {app.date_applied}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        {app.notes && (
                          <button
                            onClick={() => setSelectedAppDetails(app)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title="View application notes"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove from tracker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to record a new application */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddApplication}
      />

      {/* Detail Modal for Application Notes */}
      {selectedAppDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#090E22]/95 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{selectedAppDetails.role}</h3>
                <p className="text-xs font-semibold text-cyan-400">{selectedAppDetails.company} • Applied on {selectedAppDetails.date_applied}</p>
              </div>
              <StatusBadge status={selectedAppDetails.status} />
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recruiter / System Notes</span>
              <p className="text-xs text-slate-300 bg-[#0D132A]/80 p-3.5 rounded-xl border border-white/8 leading-relaxed font-normal">
                {selectedAppDetails.notes}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAppDetails(null)}
                className="btn-glow px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
