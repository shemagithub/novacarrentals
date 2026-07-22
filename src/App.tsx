import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { BookingProvider } from "@/contexts/BookingContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { RouteSeo } from "@/components/RouteSeo";
import { ScrollToTop } from "@/components/ScrollToTop";

const Home = lazy(() => import("@/pages/home"));
const Fleet = lazy(() => import("@/pages/fleet"));
const FleetDetail = lazy(() => import("@/pages/fleet-detail"));
const Services = lazy(() => import("@/pages/services"));
const Destinations = lazy(() => import("@/pages/destinations"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Guides = lazy(() => import("@/pages/guides"));
const GuideDetail = lazy(() => import("@/pages/guide-detail"));
const Blogs = lazy(() => import("@/pages/blogs"));
const BlogDetail = lazy(() => import("@/pages/blog-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div
        className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        aria-label="Loading page"
      />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/fleet/:id" component={FleetDetail} />
        <Route path="/services" component={Services} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/guides" component={Guides} />
        <Route path="/guides/:slug" component={GuideDetail} />
        <Route path="/blogs" component={Blogs} />
        <Route path="/blogs/:slug" component={BlogDetail} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <SiteSettingsProvider>
            <BookingProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <ScrollToTop />
                <RouteSeo />
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow pt-20">
                    <Router />
                  </main>
                  <Footer />
                </div>
                <WhatsAppWidget />
              </WouterRouter>
            </BookingProvider>
          </SiteSettingsProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
