import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
