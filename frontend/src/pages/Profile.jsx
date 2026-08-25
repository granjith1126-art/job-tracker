import React, { useState, useEffect, useRef } from 'react';
import { User, Save, Sparkles, Briefcase, CheckCircle2, ShieldCheck, Target, Camera, Trash2, Upload } from 'lucide-react';
import SkillChip from '../components/common/SkillChip';
import SearchableDropdown from '../components/common/SearchableDropdown';
import { api } from '../services/api';

export default function Profile({ userProfile, onProfileUpdated }) {
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [education, setEducation] = useState(userProfile?.education || '');
  const [university, setUniversity] = useState(userProfile?.university || '');
  const [cgpa, setCgpa] = useState(userProfile?.cgpa || 0.0);
  const [graduationYear, setGraduationYear] = useState(userProfile?.graduation_year || 2025);
  const [targetRole, setTargetRole] = useState(userProfile?.target_role || 'Machine Learning Engineer');
  const [skills, setSkills] = useState(userProfile?.skills || []);
  const [interests, setInterests] = useState(userProfile?.interests || []);
  const [experienceYears, setExperienceYears] = useState(userProfile?.experience_years || 0);
  const [experienceSummary, setExperienceSummary] = useState(userProfile?.experience_summary || '');
  const [profileStrength, setProfileStrength] = useState(userProfile?.profile_strength || 20);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [skData, roData] = await Promise.all([
          api.catalog.getSkills(),
          api.catalog.getRoles()
        ]);
        setSkillsCatalog(skData);
        setRolesCatalog(roData);
      } catch (err) {
        console.error('Failed to load catalogs:', err);
      }
    }
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
      setEducation(userProfile.education || '');
      setUniversity(userProfile.university || '');
      setCgpa(userProfile.cgpa || 0.0);
      setGraduationYear(userProfile.graduation_year || 2025);
      setTargetRole(userProfile.target_role || 'Machine Learning Engineer');
      if (userProfile.skills) setSkills(userProfile.skills);
      if (userProfile.interests) setInterests(userProfile.interests);
      if (userProfile.experience_years !== undefined) setExperienceYears(userProfile.experience_years);
      if (userProfile.experience_summary) setExperienceSummary(userProfile.experience_summary);
      if (userProfile.profile_strength) setProfileStrength(userProfile.profile_strength);
      if (userProfile.avatar_url !== undefined) setAvatarUrl(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image under 5MB.");
      return;
    }

    setIsPhotoUploading(true);
    try {
      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        setAvatarUrl(base64Data);
        try {
          const res = await api.profile.uploadPhoto(base64Data);
          if (res.profile_strength) setProfileStrength(res.profile_strength);
          if (onProfileUpdated) onProfileUpdated(res);
        } catch (err) {
          console.error('Photo upload failed:', err);
        } finally {
          setIsPhotoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Photo read error:', err);
      setIsPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoUploading(true);
    try {
      setAvatarUrl('');
      const res = await api.profile.removePhoto();
      if (res.profile_strength) setProfileStrength(res.profile_strength);
      if (onProfileUpdated) onProfileUpdated(res);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Remove photo error:', err);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleAddSkill = async (skillToAdd) => {
    if (skillToAdd && !skills.includes(skillToAdd)) {
      const updated = [...skills, skillToAdd];
      setSkills(updated);
      try {
        const res = await api.profile.addSkill(skillToAdd);
        if (res.profile_strength) setProfileStrength(res.profile_strength);
        if (onProfileUpdated) onProfileUpdated(res);
      } catch (err) {
        console.error('Failed to add skill:', err);
      }
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    try {
      const res = await api.profile.removeSkill(skillToRemove);
      if (res.profile_strength) setProfileStrength(res.profile_strength);
      if (onProfileUpdated) onProfileUpdated(res);
    } catch (err) {
      console.error('Failed to remove skill:', err);
    }
  };

  const handleAddInterest = async (interestToAdd) => {
    if (interestToAdd && !interests.includes(interestToAdd)) {
      const updated = [...interests, interestToAdd];
      setInterests(updated);
      try {
        const res = await api.profile.addInterest(interestToAdd);
        if (res.profile_strength) setProfileStrength(res.profile_strength);
        if (onProfileUpdated) onProfileUpdated(res);
      } catch (err) {
        console.error('Failed to add interest:', err);
      }
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    const updated = interests.filter(i => i !== interestToRemove);
    setInterests(updated);
    try {
      const res = await api.profile.removeInterest(interestToRemove);
      if (res.profile_strength) setProfileStrength(res.profile_strength);
      if (onProfileUpdated) onProfileUpdated(res);
    } catch (err) {
      console.error('Failed to remove interest:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedPayload = {
        name,
        email,
        phone,
        education,
        university,
        cgpa: parseFloat(cgpa) || 0.0,
        graduation_year: parseInt(graduationYear) || 2025,
        target_role: targetRole,
        skills,
        interests,
        experience_years: parseFloat(experienceYears) || 0.0,
        experience_summary: experienceSummary
      };

      const res = await api.profile.update(updatedPayload);
      setSaveSuccess(true);
      if (res.profile_strength) setProfileStrength(res.profile_strength);
      if (onProfileUpdated) onProfileUpdated(res);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      {/* Header with Completeness bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your profile photo, academic credentials, verified skills, target role, and career interests.</p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved & Synced</span>
            </span>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-indigo-900">Strength: {profileStrength}%</span>
          </div>
        </div>
      </div>

      {/* 0. PROFILE PHOTO SECTION */}
      <div className="app-card p-6 bg-white flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name || "Profile"} 
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center ring-2 ring-indigo-500/20 shadow-md uppercase">
              {name ? name.charAt(0) : 'U'}
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Profile Photo</h2>
          <p className="text-xs text-slate-500">
            Upload your professional photo. Appears in navigation, activity logs, and application tracking.
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoSelect} 
            accept="image/png,image/jpeg,image/jpg,image/webp" 
            className="hidden" 
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              disabled={isPhotoUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isPhotoUploading ? 'Processing...' : (avatarUrl ? 'Change Photo' : 'Upload Photo')}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={isPhotoUploading}
                onClick={handleRemovePhoto}
                className="h-8 px-3 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full">
        
        {/* 1. PERSONAL & ACADEMIC DETAILS */}
        <div className="app-card p-6 bg-white space-y-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Personal & Academic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Degree / Major</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">CGPA / GPA (out of 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Graduation Year</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. TECHNICAL SKILLS WITH AUTOCOMPLETE DROPDOWN */}
        <div className="app-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Technical Skills</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{skills.length} skills recorded</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <SkillChip
                  key={index}
                  label={skill}
                  onRemove={handleRemoveSkill}
                  variant="indigo"
                />
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No skills added yet. Search or add from the catalog below.</span>
            )}
          </div>

          {/* Searchable Dropdown Input */}
          <div className="pt-1">
            <SearchableDropdown
              items={skillsCatalog}
              selectedItems={skills}
              onSelect={handleAddSkill}
              placeholder="Search 120+ technical skills (e.g. Python, PyTorch, Docker, React, AWS)..."
              buttonLabel="Add Skill"
            />
          </div>
        </div>

        {/* 3. EXPERIENCE, TARGET ROLE & CAREER INTERESTS */}
        <div className="app-card p-6 bg-white space-y-5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Experience & Target Career</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Career Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              >
                {rolesCatalog.map((role) => (
                  <option key={role.id} value={role.title}>{role.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Experience Summary</label>
              <input
                type="text"
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="e.g. Building ML pipelines and REST APIs"
                className="w-full h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Career Interests Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600">Career Interests</label>
              <span className="text-xs font-semibold text-slate-500">{interests.length} interests</span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[36px] items-center p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              {interests.length > 0 ? (
                interests.map((interest, idx) => (
                  <SkillChip
                    key={idx}
                    label={interest}
                    onRemove={handleRemoveInterest}
                    variant="blue"
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No career interests selected yet.</span>
              )}
            </div>

            <div className="pt-1">
              <SearchableDropdown
                items={rolesCatalog.map(r => ({ name: r.title, category: r.category }))}
                selectedItems={interests}
                onSelect={handleAddInterest}
                placeholder="Search and add career fields (e.g. Artificial Intelligence, Cloud Architecture)..."
                buttonLabel="Add Interest"
              />
            </div>
          </div>
        </div>

        {/* Save Button Row */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary-purple h-10 px-6 cursor-pointer text-xs font-bold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}