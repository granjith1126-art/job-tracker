import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function AddApplicationModal({ isOpen, onClose, onAdd }) {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [dateApplied, setDateApplied] = useState(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role || !company) return;
    onAdd({
      role: role.trim(),
      company: company.trim(),
      status: "Applied",
      date_applied: dateApplied,
      notes: notes.trim()
    });
    setRole('');
    setCompany('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#090E22]/95 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Record Job Application</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add a job you recently applied to. Status will be tracked automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Job Role *</label>
            <input
              type="text"
              required
              placeholder="e.g. Machine Learning Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#070A17] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Google, Microsoft, TechNova"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#070A17] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Date Applied</label>
            <input
              type="text"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#070A17] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Application Notes (Optional)</label>
            <textarea
              rows="2"
              placeholder="e.g. Applied via referral / university portal."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#070A17] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 resize-none transition-colors"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-glow h-10 px-5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Record Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
