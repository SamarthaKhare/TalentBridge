import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { profileAPI, searchAPI } from '../../api/queries';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface ProfileForm {
  headline: string;
  bio: string;
  location: string;
  experienceYears: number;
  noticePeriodDays: number;
  currentCtc: number;
  expectedCtc: number;
  graduationDate: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

export default function ProfilePage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>();
  const [profile, setProfile] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillResults, setSkillResults] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await profileAPI.get();
      setProfile(data);
      const fields: (keyof ProfileForm)[] = ['headline', 'bio', 'location', 'experienceYears', 'noticePeriodDays', 'currentCtc', 'expectedCtc', 'linkedinUrl', 'githubUrl', 'portfolioUrl'];
      fields.forEach((f) => { if (data[f] !== null && data[f] !== undefined) setValue(f, data[f]); });
      if (data.graduationDate) setValue('graduationDate', data.graduationDate.split('T')[0]);
      if (data.candidateSkills) {
        setSelectedSkills(data.candidateSkills.map((cs: any) => ({
          skillId: cs.skillId,
          name: cs.skill.name,
          proficiency: cs.proficiency,
          years: cs.years,
        })));
      }
    } catch {} finally { setLoading(false); }
  };

  const searchSkills = async (q: string) => {
    setSkillSearch(q);
    if (q.length < 2) { setSkillResults([]); return; }
    try {
      const { data } = await searchAPI.suggestSkills(q);
      const existing = new Set(selectedSkills.map((s) => s.skillId));
      setSkillResults([...data.matches, ...data.related].filter((s: Skill) => !existing.has(s.id)));
    } catch {}
  };

  const addSkill = (skill: Skill) => {
    setSelectedSkills([...selectedSkills, { skillId: skill.id, name: skill.name, proficiency: 'INTERMEDIATE', years: 1 }]);
    setSkillSearch('');
    setSkillResults([]);
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const updateSkillProficiency = (skillId: string, proficiency: string) => {
    setSelectedSkills(selectedSkills.map((s) => s.skillId === skillId ? { ...s, proficiency } : s));
  };

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    setApiErrors([]);
    try {
      await profileAPI.update({
        ...data,
        experienceYears: Number(data.experienceYears) || undefined,
        noticePeriodDays: Number(data.noticePeriodDays) || undefined,
        currentCtc: Number(data.currentCtc) || undefined,
        expectedCtc: Number(data.expectedCtc) || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        skills: selectedSkills.map((s) => ({
          skillId: s.skillId,
          proficiency: s.proficiency,
          years: s.years || 0,
        })),
      });
      toast.success('Profile updated!');
      loadProfile();
    } catch (error: any) {
      const errData = error.response?.data?.error;
      if (Array.isArray(errData)) {
        // Zod validation errors — show each one
        const messages = errData.map((e: any) => {
          const field = e.path?.join('.') || 'Field';
          return `${field}: ${e.message}`;
        });
        setApiErrors(messages);
        toast.error(`Validation failed: ${messages.length} error(s)`);
      } else if (typeof errData === 'string') {
        setApiErrors([errData]);
        toast.error(errData);
      } else {
        setApiErrors(['Failed to update profile. Please check your inputs.']);
        toast.error('Failed to update profile');
      }
    } finally { setSaving(false); }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    try {
      await profileAPI.uploadResume(file);
      toast.success('Resume uploaded!');
      loadProfile();
    } catch { toast.error('Upload failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
            {profile?.profileCompletionScore || 0}%
          </div>
          <span className="text-sm text-gray-500">Complete</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {apiErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {apiErrors.map((err, i) => (
                <li key={i} className="text-sm text-red-700">{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Basic Info</h2>
          <Input label="Headline" placeholder="e.g. Full Stack Developer" {...register('headline')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea {...register('bio')} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" placeholder="City, Country" {...register('location')} />
            <Input label="Experience (years)" type="number" {...register('experienceYears')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Notice Period (days)" type="number" {...register('noticePeriodDays')} />
            <Input label="Graduation Date" type="date" {...register('graduationDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current CTC" type="number" {...register('currentCtc')} />
            <Input label="Expected CTC" type="number" {...register('expectedCtc')} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Skills</h2>
          <div className="relative">
            <Input
              placeholder="Search skills... (press Enter to add)"
              value={skillSearch}
              onChange={(e) => searchSkills(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillResults.length > 0) { addSkill(skillResults[0]); } } }}
            />
            {skillResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {skillResults.map((s) => (
                  <button key={s.id} type="button" onClick={() => addSkill(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                    {s.name} <span className="text-gray-400">({s.category})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((s) => (
              <div key={s.skillId} className="flex items-center gap-1 bg-primary-50 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-primary-700">{s.name}</span>
                <select value={s.proficiency} onChange={(e) => updateSkillProficiency(s.skillId, e.target.value)} className="text-xs bg-transparent border-none text-primary-600 focus:ring-0">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="EXPERT">Expert</option>
                </select>
                <button type="button" onClick={() => removeSkill(s.skillId)} className="text-primary-400 hover:text-red-500 ml-1">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Resume</h2>
          {profile?.resumeUrl && (
            <p className="text-sm text-green-600">Current: {profile.resumeUrl.split('/').pop()}</p>
          )}
          <input type="file" accept=".pdf" onChange={handleResumeUpload} className="text-sm" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Links</h2>
          <Input label="LinkedIn URL" {...register('linkedinUrl')} />
          <Input label="GitHub URL" {...register('githubUrl')} />
          <Input label="Portfolio URL" {...register('portfolioUrl')} />
        </div>

        <Button type="submit" className="w-full" isLoading={saving}>Save Profile</Button>
      </form>
    </div>
  );
}
