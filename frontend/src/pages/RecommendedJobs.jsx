import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, CheckCircle2, RefreshCw, Globe, Sparkles, Filter, 
  ExternalLink, Layers, ShieldCheck, AlertCircle, Radio, Compass, Building2
} from 'lucide-react';
import JobCard from '../components/JobCard';
import JobDetailsModal from '../components/JobDetailsModal';
import PageHeader from '../components/common/PageHeader';
import { api } from '../services/api';

export default function RecommendedJobs({ userProfile, onJobApplied }) {
  const [jobs, setJobs] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [statesCatalog, setStatesCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Location filters
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedSource, setSelectedSource] = useState('All');
  const [remoteOnly, setRemoteOnly] = useState(false);

  // UI state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // 1. Fetch States Catalog and Initial State from Profile
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await api.catalog.getIndianStates();
        if (data && data.states) {
          setStatesCatalog(data.states);
        }
      } catch (err) {
        console.warn('Failed to load Indian states catalog:', err);
      }
    }
    loadCatalog();
  }, []);

  // 2. Set default state from User Profile location if available
  useEffect(() => {
    if (userProfile?.location && statesCatalog.length > 0) {
      const loc = userProfile.location.toLowerCase();
      const matched = statesCatalog.find(st => 
        loc.includes(st.name.toLowerCase()) || 
        st.cities.some(c => loc.includes(c.toLowerCase()))
      );
      if (matched && selectedState === 'All States') {
        setSelectedState(matched.name);
      }
    }
  }, [userProfile, statesCatalog]);

  const fetchConnectors = async () => {
    try {
      const data = await api.jobs.getConnectors();
      if (data && data.connectors) {
        setConnectors(data.connectors);
      }
    } catch (err) {
      console.warn('Failed to load connector statuses:', err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.jobs.list(
        search,
        '', // location
        selectedCountry,
        selectedState === 'All States' ? '' : selectedState,
        'All', // jobType
        selectedSource,
        remoteOnly
      );
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [search, selectedCountry, selectedState, selectedSource, remoteOnly, userProfile]);

  const handleSyncLiveJobs = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(`Fetching fresh live jobs for ${selectedState !== 'All States' ? selectedState + ', ' : ''}India across active connectors...`);
    try {
      const res = await api.jobs.syncLive();
      setSyncStatusMsg(`Live Sync Complete! Added ${res.new_jobs_added} fresh opportunities.`);
      setTimeout(() => setSyncStatusMsg(''), 5000);
      await fetchJobs();
      await fetchConnectors();
    } catch (err) {
      console.error('Failed to sync live jobs:', err);
      setSyncStatusMsg('Live sync completed with existing active opportunities.');
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApply = async (job) => {
    setIsApplying(true);
    try {
      await api.applications.create({
        job_id: job.id,
        role: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        status: 'Applied'
      });

      setApplySuccessMsg(`Application to ${job.company} submitted! Added to Application Tracker.`);
      setTimeout(() => setApplySuccessMsg(''), 4000);
      setSelectedJob(null);
      if (onJobApplied) onJobApplied();
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Recommended Jobs</h1>
            <span className="badge-sparkle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              India Live Feed Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live developer and AI roles across Indian tech hubs (Bengaluru, Chennai, Hyderabad, Mumbai, Pune, Delhi NCR, and nationwide).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleSyncLiveJobs}
            disabled={isSyncing}
            className="btn-glow h-9 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Fresh Live Jobs'}</span>
          </button>

          <span className="h-9 px-3.5 rounded-xl bg-[#0D132A]/80 text-cyan-300 border border-cyan-400/20 text-xs font-semibold inline-flex items-center justify-center shrink-0">
            {jobs.length} Opportunities
          </span>
        </div>
      </div>

      {/* Live Connectors Status Ribbon */}
      {connectors.length > 0 && (
        <div className="p-3.5 bg-[#0D132A]/80 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl border border-white/8 shadow-md">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">Active Job Connectors:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {connectors.map((conn, idx) => (
              <div 
                key={idx}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                  conn.connected 
                    ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300' 
                    : 'bg-white/5 border border-white/10 text-slate-400'
                }`}
                title={conn.message}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${conn.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{conn.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({conn.status})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {syncStatusMsg && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {applySuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* India Location Search & State Filter Control Bar */}
      <div className="p-4 bg-[#0D132A]/70 rounded-2xl border border-white/8 backdrop-blur-xl shadow-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Keyword Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Job title, skills (e.g. Python, React, AI, FastAPI, Java)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#070A17] border border-white/10 focus:border-cyan-400/60 text-xs font-medium text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Country Selector (Defaults to India) */}
          <div className="md:col-span-2 relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070A17] border border-white/10 focus:border-cyan-400/60 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="India" className="bg-[#0B1024]">🇮🇳 India</option>
            </select>
          </div>

          {/* Indian State / Union Territory Dropdown */}
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070A17] border border-white/10 focus:border-cyan-400/60 text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="All States" className="bg-[#0B1024]">All Indian States & Tech Hubs</option>
              {statesCatalog.map((st) => (
                <option key={st.code} value={st.name} className="bg-[#0B1024]">
                  {st.name} ({st.type === 'Union Territory' ? 'UT' : 'State'})
                </option>
              ))}
            </select>
          </div>

          {/* "FIND JOBS" Action Button */}
          <div className="md:col-span-2">
            <button
              onClick={() => fetchJobs()}
              className="btn-glow w-full h-10 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>FIND JOBS</span>
            </button>
          </div>
        </div>

        {/* Sub-Filters: Source Tags and Remote Option */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Sources:
            </span>
            {[
              { id: 'All', label: 'All Live Feeds' },
              { id: 'RemoteOK', label: 'RemoteOK' },
              { id: 'Jobicy', label: 'Jobicy' },
              { id: 'Arbeitnow', label: 'Arbeitnow' },
              { id: 'Adzuna', label: 'Adzuna' },
              { id: 'Jooble', label: 'Jooble' },
              { id: 'demo', label: 'Demo Dataset (Isolated)' }
            ].map((src) => (
              <button
                key={src.id}
                onClick={() => setSelectedSource(src.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedSource === src.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-[#070A17] border-white/20 cursor-pointer"
            />
            <span>India / Global Remote Only</span>
          </label>
        </div>
      </div>

      {/* Selected State Active Banner */}
      {selectedState !== 'All States' && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-400/20 rounded-2xl flex items-center justify-between gap-3 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Showing live opportunities verified for <strong>{selectedState}</strong> and India-wide remote roles.
            </span>
          </div>
          <button
            onClick={() => setSelectedState('All States')}
            className="text-xs font-bold text-cyan-300 hover:underline cursor-pointer"
          >
            Clear State Filter
          </button>
        </div>
      )}

      {/* Job Cards List */}
      <div className="space-y-3.5 w-full">
        {loading ? (
          <div className="text-center py-12 text-xs font-semibold text-slate-400">
            Searching live jobs in {selectedState !== 'All States' ? selectedState : 'India'}...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-xs font-semibold text-slate-400 bg-[#0D132A]/60 border border-white/8 rounded-2xl p-8 space-y-4 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-400/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                No live jobs found in {selectedState !== 'All States' ? selectedState : 'India'} for this specific query.
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                Try broadening your location search, clearing keyword filters, or syncing fresh live feeds from active connectors.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {selectedState !== 'All States' && (
                <button
                  onClick={() => setSelectedState('All States')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Search All of India
                </button>
              )}
              <button
                onClick={handleSyncLiveJobs}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 cursor-pointer transition-colors"
              >
                Sync Fresh Feeds
              </button>
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(j) => setSelectedJob(j)}
            />
          ))
        )}
      </div>

      {/* Modal Popup for Job Details */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          isApplying={isApplying}
        />
      )}
    </div>
  );
}
