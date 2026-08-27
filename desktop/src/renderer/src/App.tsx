import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken, getUser, isOpsRole } from './lib/api';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { PartiesPage } from './pages/Parties';
import { InvoicesPage } from './pages/Invoices';
import { StockPage } from './pages/Stock';
import { CashPage } from './pages/Cash';
import { OkcPage } from './pages/Okc';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { ProductsPage } from './pages/Products';
import { CategoriesPage } from './pages/Categories';
import { OrdersPage } from './pages/Orders';
import { ReturnsPage } from './pages/Returns';
import { CouponsPage } from './pages/Coupons';
import { CampaignsPage } from './pages/Campaigns';
import { ReviewsPage } from './pages/Reviews';
import { ShippingPage } from './pages/Shipping';
import { MessagesPage } from './pages/Messages';
import { NewsletterPage } from './pages/Newsletter';
import { CustomersPage } from './pages/Customers';
import { NotificationsPage } from './pages/Notifications';
import { StaffRequestsPage } from './pages/StaffRequests';
import { UsersPage } from './pages/Users';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!getToken() || !user || !isOpsRole(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cari" element={<PartiesPage />} />
                <Route path="/faturalar" element={<InvoicesPage />} />
                <Route path="/stok" element={<StockPage />} />
                <Route path="/kasa" element={<CashPage />} />
                <Route path="/okc" element={<OkcPage />} />
                <Route path="/raporlar" element={<ReportsPage />} />
                <Route path="/urunler" element={<ProductsPage />} />
                <Route path="/urunler/:id" element={<ProductsPage />} />
                <Route path="/kategoriler" element={<CategoriesPage />} />
                <Route path="/siparisler" element={<OrdersPage />} />
                <Route path="/siparisler/:id" element={<OrdersPage />} />
                <Route path="/musteriler" element={<CustomersPage />} />
                <Route
                  path="/kullanicilar"
                  element={
                    <RequireAdmin>
                      <UsersPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/personel-talepleri"
                  element={
                    <RequireAdmin>
                      <StaffRequestsPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/personel-onaylari"
                  element={
                    <RequireAdmin>
                      <StaffRequestsPage />
                    </RequireAdmin>
                  }
                />
                <Route path="/bildirimler" element={<NotificationsPage />} />
                <Route path="/iadeler" element={<ReturnsPage />} />
                <Route path="/kuponlar" element={<CouponsPage />} />
                <Route path="/kampanyalar" element={<CampaignsPage />} />
                <Route path="/yorumlar" element={<ReviewsPage />} />
                <Route path="/kargo" element={<ShippingPage />} />
                <Route path="/mesajlar" element={<MessagesPage />} />
                <Route path="/bulten" element={<NewsletterPage />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
              </Routes>
            </Shell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
