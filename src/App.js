import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Flights from './pages/Flights';
import FlightDetail from './pages/FlightDetail';
import FlightCreate from './pages/FlightCreate';
import Airlines from './pages/Airlines';
import Airports from './pages/Airports';
import Reports from './pages/Reports';
import PublicBoard from './pages/PublicBoard';
import './App.css';

function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return <div className="app-auth-loading">Cargando sesión…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tablero" element={<PublicBoard />} />

          <Route element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vuelos" element={<Flights />} />
              <Route
                path="/vuelos/nuevo"
                element={
                  <AdminGate>
                    <FlightCreate />
                  </AdminGate>
                }
              />
              <Route path="/vuelos/:id" element={<FlightDetail />} />
              <Route path="/reportes" element={<Reports />} />

              <Route
                path="/aerolineas"
                element={
                  <AdminGate>
                    <Airlines />
                  </AdminGate>
                }
              />
              <Route
                path="/aeropuertos"
                element={
                  <AdminGate>
                    <Airports />
                  </AdminGate>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AdminGate({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App;
