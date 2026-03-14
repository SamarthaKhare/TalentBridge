const statusColors: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-amber-100 text-amber-800',
  INTERVIEW: 'bg-purple-100 text-purple-800',
  OFFER: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  REMOTE: 'bg-indigo-100 text-indigo-800',
  ONSITE: 'bg-orange-100 text-orange-800',
  HYBRID: 'bg-teal-100 text-teal-800',
};

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}>
      {status}
    </span>
  );
}
