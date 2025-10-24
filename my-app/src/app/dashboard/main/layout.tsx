import DashboardLayout from '@/components/dashboard-layout';
import { AuthProvider, ProtectedRoute } from '@/lib/auth-context';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>{children}</DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}