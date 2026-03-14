import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { HiOutlineBriefcase, HiOutlineUser, HiOutlineLogout } from 'react-icons/hi';
import Button from '../ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <HiOutlineBriefcase className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TalentBridge</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {user.role === 'CANDIDATE' && (
                  <>
                    <Link to="/candidate/jobs" className="text-sm text-gray-600 hover:text-gray-900">Jobs</Link>
                    <Link to="/candidate/applications" className="text-sm text-gray-600 hover:text-gray-900">Applications</Link>
                    <Link to="/candidate/saved" className="text-sm text-gray-600 hover:text-gray-900">Saved</Link>
                    <Link to="/candidate/profile" className="text-sm text-gray-600 hover:text-gray-900">Profile</Link>
                  </>
                )}
                {user.role === 'HR' && (
                  <>
                    <Link to="/hr/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/hr/jobs" className="text-sm text-gray-600 hover:text-gray-900">My Jobs</Link>
                    <Link to="/hr/candidates" className="text-sm text-gray-600 hover:text-gray-900">Search Candidates</Link>
                    <Link to="/hr/outreach" className="text-sm text-gray-600 hover:text-gray-900">Outreach</Link>
                  </>
                )}
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <HiOutlineUser className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 ml-2">
                    <HiOutlineLogout className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm">Sign Up</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
