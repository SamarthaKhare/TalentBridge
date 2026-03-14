import { Link } from 'react-router-dom';
import { useState } from 'react';
import { HiX } from 'react-icons/hi';

interface Props {
  completionScore: number;
}

export default function ProfileCompletionBanner({ completionScore }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || completionScore >= 60) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-800">
            {completionScore}%
          </div>
          <p className="text-sm text-amber-800">
            Your profile is only {completionScore}% complete.{' '}
            <Link to="/candidate/profile" className="font-medium underline">
              Complete it now
            </Link>{' '}
            to get better job matches.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800">
          <HiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
