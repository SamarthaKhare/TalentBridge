import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI, applicationsAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import ScoreRing from '../../components/ui/ScoreRing';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineBookmark, HiBookmark, HiOutlineLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function JobSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuthStore();

  // Filters
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState(searchParams.get('jobType') || '');
  const [datePosted, setDatePosted] = useState(searchParams.get('datePosted') || '');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: searchParams.get('page') || 1, limit: 10 };
      if (query) params.q = query;
      if (location) params.location = location;
      if (jobType) params.jobType = jobType;
      if (datePosted) params.datePosted = datePosted;

      const { data } = await searchAPI.jobs(params);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [searchParams, query, location, jobType, datePosted]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (isAuthenticated) {
      applicationsAPI.savedJobs().then(({ data }) => {
        setSavedJobIds(new Set(data.map((s: any) => s.jobId)));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearch = () => {
    const params: any = {};
    if (query) params.q = query;
    if (location) params.location = location;
    if (jobType) params.jobType = jobType;
    if (datePosted) params.datePosted = datePosted;
    setSearchParams(params);
  };

  const toggleSave = async (jobId: string) => {
    try {
      const { data } = await applicationsAPI.toggleSave(jobId);
      const next = new Set(savedJobIds);
      data.saved ? next.add(jobId) : next.delete(jobId);
      setSavedJobIds(next);
      toast.success(data.saved ? 'Job saved' : 'Job unsaved');
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Find Jobs</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Input placeholder="Search jobs..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All Types</option>
            <option value="REMOTE">Remote</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
          </select>
          <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Any Time</option>
            <option value="24h">Last 24h</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleSearch} size="sm">Search</Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs found. Try adjusting your filters.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} to={`/candidate/jobs/${job.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <Badge status={job.jobType} />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{job.hr?.hrProfile?.companyName || job.hr?.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {job.location && (
                      <span className="flex items-center gap-1"><HiOutlineLocationMarker className="h-4 w-4" />{job.location}</span>
                    )}
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="flex items-center gap-1">
                        ₹{job.salaryMin?.toLocaleString('en-IN')}{job.salaryMax ? ` - ₹${job.salaryMax.toLocaleString('en-IN')}` : '+'}
                      </span>
                    )}
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.jobSkills?.map((js: any) => (
                      <span key={js.id} className={`px-2 py-0.5 rounded text-xs ${js.required ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                        {js.skill.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 ml-4">
                  {isAuthenticated && (
                    <button onClick={(e) => { e.preventDefault(); toggleSave(job.id); }} className="text-gray-400 hover:text-primary-500">
                      {savedJobIds.has(job.id) ? <HiBookmark className="h-5 w-5 text-primary-500" /> : <HiOutlineBookmark className="h-5 w-5" />}
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(i + 1) })}
                  className={`px-3 py-1 rounded text-sm ${pagination.page === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
