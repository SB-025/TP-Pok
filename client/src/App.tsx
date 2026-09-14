import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthStore();
    
    if (isLoading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <>{children}</>;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomCode" 
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
      <ToastContainer theme="dark" position="top-right" />
    </Router>
  );
}

export default App;
