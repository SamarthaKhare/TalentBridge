import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../api/queries';
import Badge from '../../components/ui/Badge';
import ScoreRing from '../../components/ui/ScoreRing';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const { data } = await applicationsAPI.mine();
      setApplications(data);
    } catch {} finally { setLoading(false); }
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this application?')) return;
    try {
      await applicationsAPI.withdraw(id);
      toast.success('Application withdrawn');
      loadApplications();
    } catch { toast.error('Failed to withdraw'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No applications yet. Start exploring jobs!</div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{app.job.title}</h3>
                    <Badge status={app.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {app.job.hr?.hrProfile?.companyName || app.job.hr?.name} &middot; Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreRing score={app.matchScore} />
                  {!['WITHDRAWN', 'REJECTED', 'OFFER'].includes(app.status) && (
                    <Button variant="ghost" size="sm" onClick={() => handleWithdraw(app.id)}>
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
              {app.answers?.length > 0 && (
                <details className="mt-3">
                  <summary className="text-sm text-primary-600 cursor-pointer">View answers ({app.answers.length})</summary>
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-100">
                    {app.answers.map((a: any) => (
                      <div key={a.id}>
                        <p className="text-xs text-gray-500">{a.question?.questionText}</p>
                        <p className="text-sm">{a.answerText}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
