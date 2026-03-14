import { useState } from 'react';
import { searchAPI, outreachAPI } from '../../api/queries';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ScoreRing from '../../components/ui/ScoreRing';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { HiOutlineMail } from 'react-icons/hi';

export default function CandidateSearchPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [skills, setSkills] = useState('');

  // Email modal
  const [showEmail, setShowEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  // Profile modal
  const [profileCandidate, setProfileCandidate] = useState<any>(null);

  const search = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (query) params.q = query;
      if (location) params.location = location;
      if (expMin) params.experienceMin = expMin;
      if (expMax) params.experienceMax = expMax;
      if (noticePeriod) params.noticePeriodMax = noticePeriod;
      if (skills) params.skills = skills;

      const { data } = await searchAPI.candidates(params);
      setCandidates(data.candidates);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (userId: string) => {
    const next = new Set(selected);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.user.id)));
    }
  };

  const sendEmails = async () => {
    if (!emailSubject || !emailBody) { toast.error('Fill all fields'); return; }
    setSending(true);
    try {
      const { data } = await outreachAPI.send({
        subject: emailSubject,
        body: emailBody,
        candidateIds: Array.from(selected),
      });
      toast.success(`Sent: ${data.sent}, Failed: ${data.failed}`);
      setShowEmail(false);
      setSelected(new Set());
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Search Candidates</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <Input placeholder="Search by name, headline..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input placeholder="Exp Min" type="number" value={expMin} onChange={(e) => setExpMin(e.target.value)} />
          <Input placeholder="Exp Max" type="number" value={expMax} onChange={(e) => setExpMax(e.target.value)} />
          <Input placeholder="Notice (days)" type="number" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} />
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={search} isLoading={loading}>Search</Button>
        </div>
      </div>

      {/* Selected action bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-30 bg-primary-600 text-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-lg">
          <span>{selected.size} candidate{selected.size > 1 ? 's' : ''} selected</span>
          <Button variant="secondary" size="sm" onClick={() => setShowEmail(true)}>
            <HiOutlineMail className="h-4 w-4 mr-1" />Send Email
          </Button>
        </div>
      )}

      {/* Results */}
      {candidates.length > 0 && (
        <div className="mb-3">
          <button onClick={selectAll} className="text-sm text-primary-600 hover:underline">
            {selected.size === candidates.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c) => (
          <div key={c.id} className={`bg-white rounded-xl border p-4 ${selected.has(c.user.id) ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selected.has(c.user.id)} onChange={() => toggleSelect(c.user.id)} className="mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">{c.user.name}</h3>
                  <p className="text-xs text-gray-500">{c.headline}</p>
                </div>
              </div>
              <ScoreRing score={c.matchScore} size={40} />
            </div>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              {c.location && <p>Location: {c.location}</p>}
              {c.experienceYears !== null && <p>Experience: {c.experienceYears} years</p>}
              {c.noticePeriodDays !== null && <p>Notice: {c.noticePeriodDays} days</p>}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {c.candidateSkills?.slice(0, 5).map((cs: any) => (
                <span key={cs.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{cs.skill.name}</span>
              ))}
            </div>
            <button onClick={() => setProfileCandidate(c)} className="text-xs text-primary-600 mt-2 hover:underline">View Full Profile</button>
          </div>
        ))}
      </div>

      {/* Email Modal */}
      <Modal isOpen={showEmail} onClose={() => setShowEmail(false)} title="Compose Email" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Sending to {selected.size} candidate(s). Use {'{{candidate_name}}'}, {'{{job_title}}'}, {'{{company_name}}'} as merge fields.</p>
          <Input label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea rows={6} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEmail(false)}>Cancel</Button>
            <Button onClick={sendEmails} isLoading={sending}>Send Emails</Button>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={!!profileCandidate} onClose={() => setProfileCandidate(null)} title="Candidate Profile" size="lg">
        {profileCandidate && (
          <div className="space-y-3">
            <p><strong>Name:</strong> {profileCandidate.user.name}</p>
            <p><strong>Email:</strong> {profileCandidate.user.email}</p>
            <p><strong>Headline:</strong> {profileCandidate.headline}</p>
            <p><strong>Bio:</strong> {profileCandidate.bio}</p>
            <p><strong>Location:</strong> {profileCandidate.location}</p>
            <p><strong>Experience:</strong> {profileCandidate.experienceYears} years</p>
            <p><strong>Notice Period:</strong> {profileCandidate.noticePeriodDays} days</p>
            <p><strong>Expected CTC:</strong> {profileCandidate.expectedCtc?.toLocaleString()}</p>
            <div>
              <strong>Skills:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {profileCandidate.candidateSkills?.map((cs: any) => (
                  <span key={cs.id} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">{cs.skill.name} ({cs.proficiency})</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
