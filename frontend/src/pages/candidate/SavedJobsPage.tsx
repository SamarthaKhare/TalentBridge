import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker } from 'react-icons/hi';

export default function SavedJobsPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await applicationsAPI.savedJobs();
      setSaved(data);
    } catch {} finally { setLoading(false); }
  };

  const unsave = async (jobId: string) => {
    try {
      await applicationsAPI.toggleSave(jobId);
      setSaved(saved.filter((s) => s.jobId !== jobId));
      toast.success('Removed from saved');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
      {saved.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No saved jobs yet.</div>
      ) : (
        <div className="space-y-3">
          {saved.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <Link to={`/candidate/jobs/${s.job.id}`} className="flex-1">
                <h3 className="font-semibold">{s.job.title}</h3>
                <p className="text-sm text-gray-500">{s.job.hr?.hrProfile?.companyName}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {s.job.location && <span className="flex items-center gap-1"><HiOutlineLocationMarker className="h-4 w-4" />{s.job.location}</span>}
                  <Badge status={s.job.jobType} />
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => unsave(s.jobId)}>Remove</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
