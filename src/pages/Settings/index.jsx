import MainLayout from '../../components/layout/MainLayout';
import MigrationPanel from './MigrationPanel';

export default function SettingsPage() {
  return (
    <MainLayout title="Settings" subtitle="System configuration and maintenance">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              Database Migrations
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Manage schema migrations and check migration status.
            </p>
          </div>

          <MigrationPanel />
        </div>
      </div>
    </MainLayout>
  );
}
