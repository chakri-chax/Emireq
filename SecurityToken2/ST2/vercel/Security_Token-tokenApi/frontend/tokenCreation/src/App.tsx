import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TokenCreation from './pages/TokenCreation';
import TokenActions from './pages/TokenActions';
import Investors from './pages/Investors';
import PrimaryMarket from './pages/PrimaryMarket';
import SecondaryMarket from './pages/SecondaryMarket';
import Transactions from './pages/Transactions';
import Documents from './pages/Documents';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SignUp from './pages/SignUp';
import { TokenManagement } from './pages/TokenManagement';
function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/signup" element={<SignUp />} />

              <Route path="/tokens" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/token-creation" element={
                <ProtectedRoute>
                  <Layout>
                    <TokenCreation />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/token-actions/:tokenAddress" element={
                <ProtectedRoute>
                  <Layout>
                    <TokenActions />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/investors" element={
                <ProtectedRoute>
                  <Layout>
                    <Investors />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/primary-market" element={
                <ProtectedRoute>
                  <Layout>
                    <PrimaryMarket />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/secondary-market" element={
                <ProtectedRoute>
                  <Layout>
                    <SecondaryMarket />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <Layout>
                    <Documents />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/token-management" element={
                <ProtectedRoute>
                  <Layout>
                    <TokenManagement />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;