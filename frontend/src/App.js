import "@/App.css";
import { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { Toaster } from "sonner";

import Login from "@/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import AdminLayout from "@/components/AdminLayout";
import { ConfirmProvider } from "@/components/ConfirmProvider";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const VehicleDetail = lazy(() => import("@/pages/VehicleDetail"));
const VehicleCategories = lazy(() => import("@/pages/VehicleCategories"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const Customers = lazy(() => import("@/pages/Customers"));
const Drivers = lazy(() => import("@/pages/Drivers"));
const Payments = lazy(() => import("@/pages/Payments"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const Branches = lazy(() => import("@/pages/Branches"));
const Promotions = lazy(() => import("@/pages/Promotions"));
const Reports = lazy(() => import("@/pages/Reports"));
const UsersRoles = lazy(() => import("@/pages/UsersRoles"));
const NotificationsPage = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const AISmart = lazy(() => import("@/pages/AISmart"));
const Support = lazy(() => import("@/pages/Support"));
const Blogs = lazy(() => import("@/pages/Blogs"));
const Team = lazy(() => import("@/pages/Team"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const ContactSubmissions = lazy(() => import("@/pages/ContactSubmissions"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const ServicePage = lazy(() => import("@/pages/ServicePage"));
const TravelGuides = lazy(() => import("@/pages/TravelGuides"));
const Destinations = lazy(() => import("@/pages/Destinations"));
const PageSeo = lazy(() => import("@/pages/PageSeo"));

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <ScrollToTop />
        <BrandingProvider>
          <AuthProvider>
            <ConfirmProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/vehicles" element={<Vehicles />} />
                  <Route path="/vehicle-categories" element={<VehicleCategories />} />
                  <Route path="/vehicles/:id" element={<VehicleDetail />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/company" element={<CompanyProfile />} />
                  <Route path="/contacts" element={<ContactSubmissions />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/service" element={<ServicePage />} />
                  <Route path="/travel-guides" element={<TravelGuides />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/page-seo" element={<PageSeo />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<UsersRoles />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/ai" element={<AISmart />} />
                </Route>
              </Routes>
            </ConfirmProvider>
          </AuthProvider>
        </BrandingProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
