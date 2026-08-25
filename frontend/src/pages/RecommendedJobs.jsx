import React, { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle2 } from 'lucide-react';
import JobCard from '../components/JobCard';
import JobDetailsModal from '../components/JobDetailsModal';
import { api } from '../services/api';

export default function RecommendedJobs({ userProfile, onJobApplied }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.jobs.list(search, selectedLocation);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, selectedLocation, userProfile]);

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
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      {/* View Header with Opportunity Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recommended Jobs</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time match scoring against 375+ active technology opportunities.</p>
        </div>

        <span className="h-8 px-3.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold inline-flex items-center justify-center shrink-0 self-start sm:self-auto">
          {jobs.length} Opportunities Available
        </span>
      </div>

      {applySuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* Search & Location Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search job title, company, or skills (e.g. Python, Google, ML, Full Stack)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-2xs"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 text-xs font-semibold text-slate-700 focus:outline-none transition-colors cursor-pointer appearance-none shadow-2xs"
          >
            <option value="All">All Locations (India & Remote)</option>
            <option value="Bangalore">Bangalore, India</option>
            <option value="Hyderabad">Hyderabad, India</option>
            <option value="Chennai">Chennai, India</option>
            <option value="Pune">Pune, India</option>
            <option value="Gurgaon">Gurgaon, India</option>
            <option value="Mumbai">Mumbai, India</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Job Cards List */}
      <div className="space-y-3.5 w-full">
        {loading ? (
          <div className="text-center py-12 text-xs font-semibold text-slate-400">
            Loading recommended jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-xs font-semibold text-slate-400 app-card p-8 bg-white">
            No matching jobs found. Try adjusting your search query or location filter.
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