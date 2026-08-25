import React from 'react';
import { Settings as SettingsIcon, CheckCircle2, Cpu, ShieldCheck, Database } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function Settings() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Settings & System Configuration"
        subtitle="Manage recommendation engine preferences and system telemetry."
      />

      <div className="space-y-5">
        {/* Recommendation Engine Card */}
        <SectionCard title="AI Recommendation Engine" icon={Cpu}>
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              CareerAI utilizes multidimensional skill-vector matching and TF-IDF weighted career ontologies to compute predictive fit against 50+ real-time industry roles.
            </p>
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700">Inference Pipeline: Local Semantic ML Model & Cosine Matching</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active & Online</span>
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Database & Storage Status Card */}
        <SectionCard title="Database & Storage" icon={Database}>
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Demonstration database seeded with 53 high-growth tech positions across Bangalore, Hyderabad, Chennai, Pune, Mumbai, Gurgaon, and Remote locations.
            </p>
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700">Storage Backend: SQLite with SQLAlchemy ORM</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold shrink-0">
                <span>53 Demo Jobs Synced</span>
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}