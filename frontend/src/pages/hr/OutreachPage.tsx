import { useState, useEffect } from 'react';
import { outreachAPI } from '../../api/queries';

export default function OutreachPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    outreachAPI.history().then(({ data }) => setHistory(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Outreach History</h1>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No emails sent yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((email) => (
            <div key={email.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{email.subject}</h3>
                <span className="text-sm text-gray-500">{new Date(email.sentAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{email.recipientCount} recipients</p>
              <details>
                <summary className="text-sm text-primary-600 cursor-pointer">View recipients</summary>
                <div className="mt-2 space-y-1">
                  {email.recipients?.map((r: any) => (
                    <p key={r.id} className="text-sm">{r.candidate?.name} ({r.candidate?.email}) — {r.status}</p>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
