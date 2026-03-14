import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiDuplicate, HiTrash } from 'react-icons/hi';

export default function JobListPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const { data } = await jobsAPI.list({ status: undefined, limit: 50 });
      setJobs(data.jobs);
    } catch {} finally { setLoading(false); }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await jobsAPI.duplicate(id);
      toast.success('Job duplicated');
      loadJobs();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    try {
      await jobsAPI.delete(id);
      toast.success('Job deleted');
      loadJobs();
    } catch { toast.error('Failed'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await jobsAPI.update(id, { status });
      toast.success('Status updated');
      loadJobs();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link to="/hr/jobs/new"><Button><HiPlus className="h-4 w-4 mr-1" />Post Job</Button></Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs posted yet.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/hr/jobs/${job.id}/pipeline`} className="font-semibold hover:text-primary-600">{job.title}</Link>
                    <Badge status={job.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {job._count?.applications || 0} applicants &middot; Posted {new Date(job.createdAt).toLocaleDateString()}
                    {job.deadline && <> &middot; Deadline: {new Date(job.deadline).toLocaleDateString()}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'DRAFT' && <Button size="sm" onClick={() => handleStatusChange(job.id, 'OPEN')}>Publish</Button>}
                  {job.status === 'OPEN' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(job.id, 'PAUSED')}>Pause</Button>}
                  {job.status === 'PAUSED' && <Button size="sm" onClick={() => handleStatusChange(job.id, 'OPEN')}>Reopen</Button>}
                  {job.status === 'OPEN' && <Button size="sm" variant="danger" onClick={() => handleStatusChange(job.id, 'CLOSED')}>Close</Button>}
                  <Link to={`/hr/jobs/${job.id}/edit`}><Button size="sm" variant="ghost"><HiPencil className="h-4 w-4" /></Button></Link>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(job.id)}><HiDuplicate className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(job.id)}><HiTrash className="h-4 w-4 text-red-400" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
