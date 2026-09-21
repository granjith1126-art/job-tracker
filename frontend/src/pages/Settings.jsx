import React, { useState } from 'react';
import { Settings as SettingsIcon, CheckCircle2, Cpu, ShieldCheck, Database, Compass, ChevronRight, Copy, Check, Link2, ExternalLink, Lock } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function Settings({ onNavigateTab }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const redirectUris = [
    {
      provider: "google",
      name: "Google / YouTube",
      uri: "http://127.0.0.1:8000/api/career-radar/google/callback",
      portal: "Google Cloud Console",
      portalUrl: "https://console.cloud.google.com/apis/credentials",
      note: "Authorized redirect URIs under OAuth 2.0 Client IDs (Web application)"
    },
    {
      provider: "github",
      name: "GitHub",
      uri: "http://127.0.0.1:8000/api/career-radar/github/callback",
      portal: "GitHub Developer Settings",
      portalUrl: "https://github.com/settings/developers",
      note: "Authorization callback URL under OAuth Apps"
    },
    {
      provider: "instagram",
      name: "Instagram (Meta)",
      uri: "http://127.0.0.1:8000/api/career-radar/instagram/callback",
      portal: "Meta for Developers",
      portalUrl: "https://developers.facebook.com/apps",
      note: "Valid OAuth Redirect URIs under Instagram -> API setup with Instagram Login. Scope: instagram_business_basic"
    }
  ];

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <PageHeader
        title="Settings & System Telemetry"
        subtitle="Manage recommendation engine preferences, connected career data sources, and system telemetry."
        badge="Platform Configuration"
      />

      <div className="space-y-5">
        {/* Connected Accounts & Career Radar Card */}
        <SectionCard title="Career Radar Data Sources" icon={Compass}>
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect and manage your GitHub, Google / YouTube, and Instagram Professional accounts. 
              Tokens are encrypted at rest using server-side AES-128-CBC + HMAC-SHA256 and are never exposed to the frontend.
            </p>
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-300">Privacy Mode: Client-Side Token Isolation</span>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('career-radar') : null}
                className="btn-glow text-xs cursor-pointer"
              >
                <span>Manage Connected Accounts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </SectionCard>

        {/* OAuth 2.0 Redirect URIs & Developer Setup */}
        <SectionCard title="OAuth 2.0 Redirect URIs & Developer Portals" icon={Link2}>
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Use the exact callback URIs below when registering your OAuth applications in provider developer consoles.
              All authentication flows redirect strictly to your local CareerAI backend.
            </p>

            <div className="space-y-3">
              {redirectUris.map((item) => (
                <div key={item.provider} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      <a
                        href={item.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        <span>{item.portal}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleCopy(item.uri, item.provider)}
                      className="btn-glass text-[11px] py-1 px-2.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey === item.provider ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>Copy Redirect URI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-black/50 border border-white/10 font-mono text-[11px] text-cyan-300 break-all select-all">
                    {item.uri}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    <strong className="text-slate-300">Where to paste:</strong> {item.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Client secrets must reside strictly in <code className="text-amber-300 font-mono">backend/.env</code> and are never sent to the browser.</span>
            </div>
          </div>
        </SectionCard>

        {/* Recommendation Engine Card */}
        <SectionCard title="AI Recommendation Engine" icon={Cpu}>
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              CareerAI utilizes multidimensional skill-vector matching, semantic ML career ontologies, and Career Radar evidence weighting to compute predictive fit against 50+ real-time industry roles.
            </p>
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-300">Inference Pipeline: Deterministic Weighted Model + Gemini / OpenAI</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active & Online</span>
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Database & Storage Status Card */}
        <SectionCard title="Database & Storage Architecture" icon={Database}>
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Demonstration database seeded with high-growth technology positions across India and Remote locations, supported by real-time connectors for RemoteOK, Jobicy, Arbeitnow, Adzuna, and Jooble.
            </p>
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-300">Storage Backend: SQLite with SQLAlchemy ORM + Encrypted Token Storage</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold shrink-0">
                <span>Verified Connected</span>
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
