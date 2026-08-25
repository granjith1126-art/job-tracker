import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, Sparkles, GraduationCap, Building, Award, Calendar, Briefcase } from 'lucide-react';
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
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resume Analyzer</h1>
        <p className="text-xs text-slate-500 mt-1">Upload your PDF or DOCX resume for genuine NLP extraction and automated profile matching.</p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        
        {/* Left Column: Upload Dropzone Card */}
        <div className="lg:col-span-6 app-card p-6 bg-white flex flex-col justify-center">
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
            className={`w-full min-h-[340px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all text-center ${
              isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40'
            }`}
          >
            {/* Cloud Icon in Circle */}
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Upload Resume</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Drag and drop your resume file here or click to browse
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-normal">
              Supports genuine PDF & DOCX documents (Max 10MB)
            </p>

            {/* Choose File Button */}
            <div className="mt-6 flex flex-wrap gap-3 items-center justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-primary-purple"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Text & Skills...</span>
                  </>
                ) : (
                  <span>Choose Resume File</span>
                )}
              </button>
            </div>

            {uploadSuccess && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume parsed and synced with your profile!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Entities & Experience Summary */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          
          {/* Extracted Skills Card */}
          <div className="app-card p-6 bg-white space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Extracted Technical Skills</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">{extractedSkills.length} skills</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 min-h-[60px] items-center">
              {extractedSkills.length > 0 ? (
                extractedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="skill-pill-cyan"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills extracted yet. Upload a resume to detect your skills.</span>
              )}
            </div>
          </div>

          {/* Academic & Experience Details Card */}
          {parsedData && (
            <div className="app-card p-6 bg-white space-y-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Academic & Experience Detection</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px]">Degree</span>
                    <span className="font-semibold text-slate-800 truncate">{parsedData.education || 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px]">University</span>
                    <span className="font-semibold text-slate-800 truncate">{parsedData.university || 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">CGPA</span>
                    <span className="font-semibold text-slate-800">{parsedData.cgpa > 0 ? parsedData.cgpa : 'Not detected'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Experience</span>
                    <span className="font-semibold text-slate-800">{parsedData.experience_years > 0 ? `${parsedData.experience_years} Years` : 'Fresh Graduate / Student'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Box: Experience Summary */}
          <div className="app-card p-6 bg-white space-y-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Experience Summary</h2>
            <p className="text-xs text-slate-700 font-normal leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {experienceSummary || 'Experience summary will appear here automatically once your resume is uploaded.'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}