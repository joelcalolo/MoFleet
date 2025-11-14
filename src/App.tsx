import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyUserProvider } from "@/contexts/CompanyUserContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import EmailConfirm from "./pages/EmailConfirm";
import Cars from "./pages/Cars";
import Customers from "./pages/Customers";
import Reservations from "./pages/Reservations";
import Schedule from "./pages/Schedule";
import Fleet from "./pages/Fleet";
import RentalsSummary from "./pages/RentalsSummary";
import RentalDetails from "./pages/RentalDetails";
import ReservationDetails from "./pages/ReservationDetails";
import Settings from "./pages/Settings";
import CompanyUsers from "./pages/CompanyUsers";
import Welcome from "./pages/Welcome";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CompanyUserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/confirm" element={<EmailConfirm />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/rentals-summary" element={<RentalsSummary />} />
          <Route path="/rental/:id" element={<RentalDetails />} />
          <Route path="/reservation/:id" element={<ReservationDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/company-users" element={<CompanyUsers />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CompanyUserProvider>
  </QueryClientProvider>
);

export default App;
