import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { ClinicalRecordsPage } from './pages/ClinicalRecordsPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProceduresPage } from './pages/ProceduresPage';
import { RoomsPage } from './pages/RoomsPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { NfeSettingsPage } from './pages/nfe/NfeSettingsPage';
import { InsurancesPage } from './pages/InsurancesPage';
import { LabPage } from './pages/lab/LabPage';
import { OnlineBookingPage } from './pages/OnlineBookingPage';
import { PrivacyPage } from './pages/privacy/PrivacyPage';
import { AiPage } from './pages/AiPage';
import { MercadoPagoSettings } from './pages/settings/MercadoPagoSettings';
import { MigrationPage } from './pages/MigrationPage';
import { TreatmentPlansPage } from './pages/TreatmentPlansPage';
import { AnamnesisPage } from './pages/AnamnesisPage';
import { FinancialAdvancedPage } from './pages/FinancialAdvancedPage';
import { RecallPage } from './pages/RecallPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { CommissionsPage } from './pages/CommissionsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ClinicDataPage } from './pages/settings/ClinicDataPage';
import { SecurityPage } from './pages/settings/SecurityPage';
import { NotificationsConfigPage } from './pages/settings/NotificationsConfigPage';
import { WhatsAppPage } from './pages/settings/WhatsAppPage';
import { AppearancePage } from './pages/settings/AppearancePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/agendar" element={<OnlineBookingPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="scheduling" element={<SchedulingPage />} />
        <Route path="clinical-records" element={<ClinicalRecordsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="procedures" element={<ProceduresPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="professionals" element={<ProfessionalsPage />} />
        <Route path="insurances" element={<InsurancesPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="ai" element={<AiPage />} />
        <Route path="migration" element={<MigrationPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="treatment-plans" element={<TreatmentPlansPage />} />
        <Route path="anamnesis" element={<AnamnesisPage />} />
        <Route path="financial-advanced" element={<FinancialAdvancedPage />} />
        <Route path="recall" element={<RecallPage />} />
        <Route path="cash-flow" element={<CashFlowPage />} />
        <Route path="commissions" element={<CommissionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="payments/*" element={<PaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/clinic-data" element={<ClinicDataPage />} />
        <Route path="settings/security" element={<SecurityPage />} />
        <Route path="settings/notifications" element={<NotificationsConfigPage />} />
        <Route path="settings/whatsapp" element={<WhatsAppPage />} />
        <Route path="settings/appearance" element={<AppearancePage />} />
        <Route path="settings/nfe" element={<NfeSettingsPage />} />
        <Route path="settings/mercadopago" element={<MercadoPagoSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
