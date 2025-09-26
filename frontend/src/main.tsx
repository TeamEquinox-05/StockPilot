import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Vendors from './pages/Vendors';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRouter from './components/AuthRouter';

const AppRouter = () => (
  <Router>
    <AuthRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } />
        <Route path="/purchases" element={
          <ProtectedRoute>
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="/vendors" element={
          <ProtectedRoute>
            <Vendors />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthRouter>
  </Router>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
