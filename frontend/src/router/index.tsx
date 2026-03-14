import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import JobSearchPage from '../pages/candidate/JobSearchPage';
import JobDetailPage from '../pages/candidate/JobDetailPage';
import ApplicationsPage from '../pages/candidate/ApplicationsPage';
import SavedJobsPage from '../pages/candidate/SavedJobsPage';
import ProfilePage from '../pages/candidate/ProfilePage';
import CandidateDashboard from '../pages/candidate/DashboardPage';
import HrDashboardPage from '../pages/hr/HrDashboardPage';
import JobPostPage from '../pages/hr/JobPostPage';
import JobListPage from '../pages/hr/JobListPage';
import PipelinePage from '../pages/hr/PipelinePage';
import CandidateSearchPage from '../pages/hr/CandidateSearchPage';
import OutreachPage from '../pages/hr/OutreachPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/candidate/jobs" replace /> },

      // Auth
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Candidate
      { path: 'candidate/dashboard', element: <CandidateDashboard /> },
      { path: 'candidate/jobs', element: <JobSearchPage /> },
      { path: 'candidate/jobs/:id', element: <JobDetailPage /> },
      { path: 'candidate/applications', element: <ApplicationsPage /> },
      { path: 'candidate/saved', element: <SavedJobsPage /> },
      { path: 'candidate/profile', element: <ProfilePage /> },

      // HR
      { path: 'hr/dashboard', element: <HrDashboardPage /> },
      { path: 'hr/jobs', element: <JobListPage /> },
      { path: 'hr/jobs/new', element: <JobPostPage /> },
      { path: 'hr/jobs/:id/edit', element: <JobPostPage /> },
      { path: 'hr/jobs/:id/pipeline', element: <PipelinePage /> },
      { path: 'hr/candidates', element: <CandidateSearchPage /> },
      { path: 'hr/outreach', element: <OutreachPage /> },
    ],
  },
]);
