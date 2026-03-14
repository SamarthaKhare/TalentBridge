import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import ScoreRing from '../../components/ui/ScoreRing';
import ProfileCompletionBanner from '../../components/layout/ProfileCompletionBanner';

export default function CandidateDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.candidate().then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  return (
    <>
      <ProfileCompletionBanner completionScore={data.profile.completionScore} />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Applied', value: data.applicationStats.APPLIED || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Shortlisted', value: data.applicationStats.SHORTLISTED || 0, color: 'bg-amber-50 text-amber-700' },
            { label: 'Interviews', value: data.applicationStats.INTERVIEW || 0, color: 'bg-purple-50 text-purple-700' },
            { label: 'Saved Jobs', value: data.savedJobsCount, color: 'bg-gray-50 text-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm opacity-75">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Recent Applications</h2>
              <Link to="/candidate/applications" className="text-sm text-primary-600">View all</Link>
            </div>
            {data.recentApplications.length === 0 ? (
              <p className="text-sm text-gray-500">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentApplications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{app.job.title}</p>
                      <p className="text-xs text-gray-500">{app.job.hr?.hrProfile?.companyName}</p>
                    </div>
                    <Badge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Recommended for You</h2>
            {data.recommendations.length === 0 ? (
              <p className="text-sm text-gray-500">Complete your profile to get recommendations.</p>
            ) : (
              <div className="space-y-3">
                {data.recommendations.map((rec: any) => (
                  <Link key={rec.job.id} to={`/candidate/jobs/${rec.job.id}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                    <div>
                      <p className="text-sm font-medium">{rec.job.title}</p>
                      <p className="text-xs text-gray-500">{rec.job.company} &middot; {rec.job.location}</p>
                    </div>
                    <ScoreRing score={rec.matchScore} size={40} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
