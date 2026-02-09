import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoadingScreen from './components/layout/LoadingScreen';
import Login from './pages/Login';
import RequestAccess from './pages/RequestAccess';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Collaborators from './pages/Collaborators';
import PendingRequests from './pages/PendingRequests';
import SearchPage from './pages/SearchPage';
import TasksPage from './pages/TasksPage';
import Settings from './pages/Settings';
import MeetingsPage from './pages/MeetingsPage';
import ProjectRequestsPage from './pages/ProjectRequestsPage';
import About from './pages/About';
import ProjectForm from './components/projects/ProjectForm';
import AgendaForm from './components/agendas/AgendaForm';
import AgendaDetailView from './components/agendas/AgendaDetailView';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <LoadingScreen />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/request-access" element={<RequestAccess />} />

            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout><Dashboard /></MainLayout>} path="/" />

              {/* Projects & Analytics */}
              <Route element={<MainLayout><Analytics /></MainLayout>} path="/projects" />
              <Route element={<MainLayout><ProjectForm /></MainLayout>} path="/projects/new" />
              <Route element={<MainLayout><ProjectForm /></MainLayout>} path="/projects/:id/edit" />
              <Route element={<MainLayout><Analytics /></MainLayout>} path="/analytics" />

              {/* Tasks / Agendas */}
              <Route element={<MainLayout><TasksPage /></MainLayout>} path="/tasks" />
              <Route element={<MainLayout><AgendaForm /></MainLayout>} path="/tasks/new" />
              <Route element={<MainLayout><AgendaDetailView /></MainLayout>} path="/tasks/:id" />
              <Route element={<MainLayout><AgendaForm /></MainLayout>} path="/tasks/:id/edit" />

              {/* Meetings */}
              <Route element={<MainLayout><MeetingsPage /></MainLayout>} path="/meetings" />
              <Route element={<MainLayout><AgendaForm /></MainLayout>} path="/meetings/new" />
              <Route element={<MainLayout><AgendaDetailView /></MainLayout>} path="/meetings/:id" />

              {/* Other Features */}
              <Route element={<MainLayout><SearchPage /></MainLayout>} path="/search" />
              <Route element={<MainLayout><About /></MainLayout>} path="/about" />
              <Route element={<MainLayout><About /></MainLayout>} path="/profile/:id" />
              <Route element={<MainLayout><Settings /></MainLayout>} path="/settings" />
              <Route element={<MainLayout><Calendar /></MainLayout>} path="/calendar" />
              <Route element={<MainLayout><Collaborators /></MainLayout>} path="/collaborators" />
              <Route element={<MainLayout><PendingRequests /></MainLayout>} path="/auth/requests" />
              <Route element={<MainLayout><ProjectRequestsPage /></MainLayout>} path="/project-requests" />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
