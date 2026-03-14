import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HrDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.hr().then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
        <Link to="/hr/jobs/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Post New Job</Link>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: data.overview.totalJobs },
          { label: 'Applications', value: data.overview.totalApplications },
          { label: 'Avg Match', value: `${data.overview.avgMatchScore}%` },
          { label: 'Interviews', value: data.overview.interviews },
          { label: 'Offers', value: data.overview.offers },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-sm text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-lg mb-4">Job Pipelines</h2>
          <div className="space-y-3">
            {data.pipeline.map((job: any) => (
              <Link key={job.id} to={`/hr/jobs/${job.id}/pipeline`} className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{job.title}</span>
                  <Badge status={job.status} />
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{job.pipeline.APPLIED} Applied</span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded">{job.pipeline.SHORTLISTED} Shortlisted</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{job.pipeline.INTERVIEW} Interview</span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{job.pipeline.OFFER} Offer</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Skills Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-lg mb-4">Top Skills in Demand</h2>
          {data.topSkillsInDemand.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topSkillsInDemand} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="skill" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">No data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
