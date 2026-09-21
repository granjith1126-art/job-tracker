import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, Sparkles, GraduationCap, Building, Award, Calendar, Briefcase, FileText } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { api } from '../services/api';

export default function ResumeAnalyzer({ userProfile, onSkillsExtracted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState(userProfile?.skills || []);
  const [experienceSummary, setExperienceSummary] = useState(userProfile?.experience_summary || '');

  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const data = await api.resume.upload(file);
      setParsedData(data);
      setExtractedSkills(data.extracted_skills || []);
      setExperienceSummary(data.experience_summary || '');
      setUploadSuccess(true);
      if (onSkillsExtracted) {
        onSkillsExtracted(data);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none text-slate-100">
      {/* View Header */}
      <PageHeader
        title="Resume Analyzer"
        subtitle="Upload your PDF or DOCX resume for genuine NLP entity extraction, ATS readiness scoring, and automated profile matching."
        badge={extractedSkills.length > 0 ? `${extractedSkills.length} Skills Extracted` : null}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        
        {/* Left Column: Upload Dropzone Card */}
        <div className="lg:col-span-6 bg-[#0D132A]/70 border border-white/8 rounded-2xl p-6 md:p-8 flex flex-col justify-center backdrop-blur-xl shadow-xl">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full min-h-[360px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all duration-300 text-center ${
              isDragging 
                ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' 
                : 'border-white/10 hover:border-cyan-400/50 bg-[#070A17]/60'
            }`}
          >
            {/* Cloud Icon in Glow Circle */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-400/30 shadow-lg">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">Upload Resume</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Drag and drop your resume file here, or click the button below to browse.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">
              Supports genuine PDF & DOCX documents (Max 10MB)
            </p>

            {/* Choose File Button */}
            <div className="mt-6 flex flex-wrap gap-3 items-center justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Text & Skills...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Choose Resume File</span>
                  </>
                )}
              </button>
            </div>

            {uploadSuccess && (
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Resume parsed and synced with your profile!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Entities & Experience Summary */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          
          {/* Extracted Skills Card */}
          <div className="bg-[#0D132A]/70 border border-white/8 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Extracted Technical Skills</span>
              </h2>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                {extractedSkills.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 min-h-[60px] items-center">
              {extractedSkills.length > 0 ? (
                extractedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No skills extracted yet. Upload a resume to detect your skills automatically.</span>
              )}
            </div>
          </div>

          {/* Academic & Experience Details Card */}
          {parsedData && (
            <div className="bg-[#0D132A]/70 border border-white/8 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-white tracking-tight">Academic & Experience Detection</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#070A17]/80 border border-white/8 flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500 block text-[10px]">Degree</span>
                    <span className="font-semibold text-white truncate block">{parsedData.education || 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070A17]/80 border border-white/8 flex items-center gap-3">
                  <Building className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500 block text-[10px]">University</span>
                    <span className="font-semibold text-white truncate block">{parsedData.university || 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070A17]/80 border border-white/8 flex items-center gap-3">
                  <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[10px]">CGPA</span>
                    <span className="font-semibold text-white">{parsedData.cgpa > 0 ? parsedData.cgpa : 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070A17]/80 border border-white/8 flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[10px]">Experience</span>
                    <span className="font-semibold text-white">{parsedData.experience_years > 0 ? `${parsedData.experience_years} Years` : 'Fresh Graduate / Student'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Box: Experience Summary */}
          <div className="bg-[#0D132A]/70 border border-white/8 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Experience Summary</h2>
            <p className="text-xs text-slate-300 font-normal leading-relaxed bg-[#070A17]/80 p-4 rounded-xl border border-white/8">
              {experienceSummary || 'Experience summary will appear here automatically once your resume is uploaded.'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
