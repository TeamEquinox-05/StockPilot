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
import PurchasePage from './pages/PurchasePage';
import ViewPurchases from './pages/ViewPurchases';
import PurchaseDetailsView from './pages/PurchaseDetailsView';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import ViewPurchaseOrders from './pages/ViewPurchaseOrders';
import PurchaseOrderDetails from './pages/PurchaseOrderDetails';
import Chat from './pages/Chat';
import Integrations from './pages/Integrations';
import Reports from './pages/Reports';

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
            <PurchasePage />
          </ProtectedRoute>
        } />
        <Route path="/purchases/add" element={
          <ProtectedRoute>
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="/purchases/list" element={
          <ProtectedRoute>
            <ViewPurchases />
          </ProtectedRoute>
        } />
        <Route path="/purchases/create-order" element={
          <ProtectedRoute>
            <CreatePurchaseOrder />
          </ProtectedRoute>
        } />
        <Route path="/purchases/orders" element={
          <ProtectedRoute>
            <ViewPurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="/purchase-orders/:id" element={
          <ProtectedRoute>
            <PurchaseOrderDetails />
          </ProtectedRoute>
        } />
        <Route path="/purchases/:id" element={
          <ProtectedRoute>
            <PurchaseDetailsView />
          </ProtectedRoute>
        } />
        <Route path="/vendors" element={
          <ProtectedRoute>
            <Vendors />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/integrations" element={
          <ProtectedRoute>
            <Integrations />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
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
