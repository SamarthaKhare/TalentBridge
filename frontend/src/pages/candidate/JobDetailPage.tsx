import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker, HiOutlineCurrencyDollar, HiOutlineClock, HiOutlineBriefcase } from 'react-icons/hi';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJob();
    checkApplication();
  }, [id]);

  const loadJob = async () => {
    try {
      const { data } = await jobsAPI.getById(id!);
      setJob(data);
    } catch { navigate('/candidate/jobs'); }
    finally { setLoading(false); }
  };

  const checkApplication = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await applicationsAPI.mine();
      setHasApplied(data.some((a: any) => a.jobId === id));
    } catch {}
  };

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (job.questionnaire?.questions?.length > 0) { setShowModal(true); return; }
    submitApplication();
  };

  const submitApplication = async () => {
    setApplying(true);
    try {
      const answersList = Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText }));
      await applicationsAPI.apply({ jobId: id, answers: answersList.length > 0 ? answersList : undefined });
      toast.success('Application submitted!');
      setHasApplied(true);
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!job) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            <p className="text-gray-500 mb-3">{job.hr?.hrProfile?.companyName || job.hr?.name}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {job.location && <span className="flex items-center gap-1"><HiOutlineLocationMarker className="h-4 w-4" />{job.location}</span>}
              <span className="flex items-center gap-1"><HiOutlineBriefcase className="h-4 w-4" /><Badge status={job.jobType} /></span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1"><HiOutlineCurrencyDollar className="h-4 w-4" />${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}</span>
              )}
              {(job.experienceMin !== null || job.experienceMax !== null) && (
                <span className="flex items-center gap-1"><HiOutlineClock className="h-4 w-4" />{job.experienceMin}-{job.experienceMax} years</span>
              )}
            </div>
          </div>
          {user?.role === 'CANDIDATE' && (
            <Button onClick={handleApply} disabled={hasApplied} size="lg">
              {hasApplied ? 'Already Applied' : 'Apply Now'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Job Description</h2>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Required Skills</h3>
            <div className="space-y-2">
              {job.jobSkills?.map((js: any) => (
                <div key={js.id} className="flex items-center justify-between">
                  <span className={`text-sm ${js.required ? 'font-medium' : 'text-gray-600'}`}>{js.skill.name}</span>
                  <div className="flex items-center gap-2">
                    {js.required && <span className="text-xs text-red-500">Required</span>}
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(js.weight / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {job.deadline && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-2">Deadline</h3>
              <p className="text-sm text-gray-600">{new Date(job.deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Questionnaire Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Application Questionnaire" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {job.questionnaire?.questions?.map((q: any) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {q.questionText} {q.isRequired && <span className="text-red-500">*</span>}
              </label>
              {q.questionType === 'TEXT' && (
                <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.questionType === 'NUMBER' && (
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.questionType === 'DATE' && (
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
              )}
              {q.questionType === 'BOOLEAN' && (
                <div className="flex gap-4">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.questionType === 'SELECT' && (
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                  <option value="">Select...</option>
                  {q.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={submitApplication} isLoading={applying}>Submit Application</Button>
        </div>
      </Modal>
    </div>
  );
}
