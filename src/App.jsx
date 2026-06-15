import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Users from './pages/Users/index';
import Assets from './pages/assets/index';
import AssetDetail from './pages/assets/AssetViewModal';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/Assignments/AssignmentDetail';
import ReturnHistory from './pages/Assignments/ReturnHistory';
import GatePassList from './pages/Assignments/GatePassList';
import Accessories from './pages/accessories/index';
import ReturnPage from './pages/Assignments/ReturnPage';
import LocationsPage from './pages/Locations';
import SubLocationsPage from './pages/SubLocations';
import UserViewModal from './pages/Users/UserViewModal';
import SalvagedAssetDetail from './pages/SalvagedAssets/SalvagedAssetDetail';
import SalvagedAssets from './pages/SalvagedAssets';
import Repairs from './pages/Repairs';
import AssetTypesPage from './pages/assetTypes';
import AssetFormModal from './pages/assets/AssetFormModal';
import AssetTypeForm from './pages/assetTypes/AssetTypeForm';
import DocumentViewer from './pages/documents/DocumentViewer';
// import Dummy from './pages/dummy';
import ForceChangePassword from './pages/ForceChangePassword';
import AuditLog from './pages/Audit';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';
import SidebarAccessPage from './pages/SidebarAccess';
const KEY_TO_PATH = {
  dashboard:        '/dashboard',
  assets:           '/assets',
  salvaged:         '/salvaged',
  assignments:      '/assignments',
  'return-history': '/return-history',
  'gate-passes':    '/gate-passes',
  history:          '/history',
  repairs:          '/repairs',
  components:       '/locations',
  users:            '/users',
  departments:      '/departments',
  audit:            '/audit',
  settings:         '/settings',
};

// ─── Protected Route ─────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  if (!user) return children;
  if (user.is_super_admin) return <Navigate to="/dashboard" replace />;
  const access = user.sidebar_access || [];
  const firstPath = access.map(k => KEY_TO_PATH[k]).find(Boolean) || '/dashboard';
  return <Navigate to={firstPath} replace />;
};

const ResetPasswordRoute = ({ children }) => {
  // Check localStorage for the token instead of Redux user state
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};
function App() {
  return (

    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
{/* <Route path="/dummy" element={
        <PublicRoute><Dummy /></PublicRoute>
      } /> */}
     <Route path="/change-password" element={
        <ResetPasswordRoute><ForceChangePassword /></ResetPasswordRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute><Departments /></ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute><Users /></ProtectedRoute>
      } />

      <Route path="/assets" element={
        <ProtectedRoute><Assets /></ProtectedRoute>
      } />

      <Route path="/accessories" element={
        <ProtectedRoute><Accessories /></ProtectedRoute>
      } />

      <Route path="/assignments/return" element={
        <ProtectedRoute><ReturnPage /></ProtectedRoute>
      } />

      <Route path="/locations" element={
        <ProtectedRoute><LocationsPage /></ProtectedRoute>
      } />

      <Route path="/sub-locations" element={
        <ProtectedRoute><SubLocationsPage /></ProtectedRoute>
      } />

      <Route path="/users/:id" element={
        <ProtectedRoute><UserViewModal /></ProtectedRoute>
      } />

            <Route path="/returns" element={
        <ProtectedRoute><ReturnPage /></ProtectedRoute>
      } />

          <Route path="/salvaged" element={
        <ProtectedRoute><SalvagedAssets /></ProtectedRoute>
      } />

          <Route path="/salvaged/:assetId" element={
        <ProtectedRoute><SalvagedAssetDetail /></ProtectedRoute>
      } />

                <Route path="/repairs" element={
        <ProtectedRoute><Repairs /></ProtectedRoute>
      } />

                      <Route path="/asset-types" element={
        <ProtectedRoute><AssetTypesPage /></ProtectedRoute>
      } />

                            <Route path="/asset-types/new" element={
        <ProtectedRoute><AssetTypeForm /></ProtectedRoute>
      } />
<Route path="/audit" element={
        <ProtectedRoute><AuditLog /></ProtectedRoute>
      } />
      <Route path="/documents/view" element={<DocumentViewer />} />
 
      <Route path="/assignments/:assignmentId" element={<AssignmentDetail />} />
      <Route path="/return-history" element={<ProtectedRoute><ReturnHistory /></ProtectedRoute>} />
      <Route path="/gate-passes" element={<ProtectedRoute><GatePassList /></ProtectedRoute>} />

      <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />

      <Route path="/assets/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/sidebar-access" element={<ProtectedRoute><SidebarAccessPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
