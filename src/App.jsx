import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';

/**
 * App Component
 * Seamless client-side router for the 4 primary PortSentinel destinations:
 * - 'home' ('/')
 * - 'how-it-works' ('/how-it-works')
 * - 'about' ('/about')
 * - 'dashboard' ('/dashboard')
 */
export function App() {
  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/dashboard')) return 'dashboard';
      if (path.startsWith('/how-it-works')) return 'how-it-works';
      if (path.startsWith('/about')) return 'about';
    }
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/dashboard')) {
        setCurrentRoute('dashboard');
      } else if (path.startsWith('/how-it-works')) {
        setCurrentRoute('how-it-works');
      } else if (path.startsWith('/about')) {
        setCurrentRoute('about');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToRoute = (routeId) => {
    let urlPath = '/';
    if (routeId === 'dashboard') urlPath = '/dashboard';
    else if (routeId === 'how-it-works') urlPath = '/how-it-works';
    else if (routeId === 'about') urlPath = '/about';

    window.history.pushState({}, '', urlPath);
    setCurrentRoute(routeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentRoute === 'dashboard') {
    return (
      <DashboardPage
        onNavigateLanding={() => navigateToRoute('home')}
        onNavigateRoute={navigateToRoute}
      />
    );
  }

  if (currentRoute === 'how-it-works') {
    return <HowItWorksPage onNavigateRoute={navigateToRoute} />;
  }

  if (currentRoute === 'about') {
    return <AboutPage onNavigateRoute={navigateToRoute} />;
  }

  return <LandingPage onNavigateRoute={navigateToRoute} />;
}

export default App;
