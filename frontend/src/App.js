import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import ClientShare from './pages/ClientShare';
import Login from './pages/Login';
import TradeActivity from './pages/TradeActivity';
import PunchList from './pages/PunchList';
import ProtectedRoute from './components/ProtectedRoute';
import { setupAxiosInterceptors } from './utils/auth';

setupAxiosInterceptors();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:token" element={<ClientShare />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trades" element={<ProtectedRoute><TradeActivity /></ProtectedRoute>} />
        <Route path="/punchlist" element={<ProtectedRoute><PunchList /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
