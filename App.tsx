
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SundayOverviewPage from './pages/SundayOverviewPage';
import MembersPage from './pages/MembersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import EventsPage from './pages/EventsPage';
import ReportsAdminPage from './pages/ReportsAdminPage';
import FinancesPage from './pages/FinancesPage';
import AttendancePage from './pages/AttendancePage';
import ResourcesPage from './pages/ResourcesPage';
import VolunteersPage from './pages/VolunteersPage';
import PrayerRequestsPage from './pages/PrayerRequestsPage';
import AiAssistantPage from './pages/AiAssistantPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import HealthCheckPage from './pages/HealthCheckPage';
import NotFoundPage from './pages/NotFoundPage';
import DocumentsPage from './pages/DocumentsPage';
import { useData } from './context/DataContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function AppContent() {
  const { currentUser, isAuthLoading } = useData();
  const location = useLocation();

  // Show loading spinner while Firebase Auth initializes
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-accent mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Authenticated - show main app with protected routes
  return (
    <MainLayout onLogout={() => { }}>
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/sunday-overview"
            element={
              <ProtectedRoute requiredPermission="VIEW_FINANCES">
                <SundayOverviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute requiredPermission="VIEW_MEMBERS">
                <MembersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredPermission="VIEW_DEPARTMENTS">
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports-admin"
            element={
              <ProtectedRoute requiredPermission="MANAGE_DEPARTMENTS">
                <ReportsAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute requiredPermission="MANAGE_EVENTS">
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finances"
            element={
              <ProtectedRoute requiredPermission="VIEW_FINANCES">
                <FinancesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute requiredPermission="VIEW_DEPARTMENTS">
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedRoute requiredPermission="VIEW_DEPARTMENTS">
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteers"
            element={
              <ProtectedRoute requiredPermission="VIEW_DEPARTMENTS">
                <VolunteersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prayer-requests"
            element={
              <ProtectedRoute requiredPermission="VIEW_PASTORAL_CARE">
                <PrayerRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute requiredPermission="VIEW_PASTORAL_CARE">
                <AiAssistantPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredPermission="MANAGE_SETTINGS">
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="MANAGE_ROLES">
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute requiredPermission="MANAGE_SETTINGS">
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/health-check" element={<HealthCheckPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </MainLayout>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
          },
        }}
      />
    </DataProvider>
  );
}

export default App;

