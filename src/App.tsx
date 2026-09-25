import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Car, Review, Inquiry, AgencySettings } from './types';
import { storage } from './utils/storage';
import { auth, signInWithGoogle, logOut, firebaseSync, isUserAdmin, clearDynamicAdminEmails } from './firebase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { CatalogView } from './views/CatalogView';
import { ReviewsView } from './views/ReviewsView';
import { LocationView } from './views/LocationView';
import { ContactView } from './views/ContactView';
import { AdminView } from './views/AdminView';
import { CarDetailModal } from './components/CarDetailModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [cars, setCars] = useState<Car[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(() => storage.getAgencySettings());
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [catalogInitialFilters, setCatalogInitialFilters] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [, setAdminAccessVersion] = useState(0);
  const hasAdminAccess = isUserAdmin(currentUser);

  // Sync state from storage
  const loadData = () => {
    setCars(storage.getCars());
    setReviews(storage.getReviews());
    setInquiries(storage.getInquiries());
    setAgencySettings(storage.getAgencySettings());
  };

  useEffect(() => {
    loadData();

    // 1. Subscribe to local storage notify events
    const unsubscribeStorage = storage.subscribe(() => {
      loadData();
    });

    // 2. Firebase Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearDynamicAdminEmails();
      setCurrentUser(user);
    });

    // 3. Real-time Firestore sync for cars with smart local persistence merge
    const unsubscribeCars = firebaseSync.subscribeCars((firestoreCars) => {
      if (Array.isArray(firestoreCars)) {
        storage.setCarsFromFirebase(firestoreCars);
        setCars(storage.getCars());
      }
    });

    // 4. Real-time Firestore sync for reviews
    const unsubscribeReviews = firebaseSync.subscribeReviews((firestoreReviews) => {
      if (Array.isArray(firestoreReviews)) {
        setReviews(firestoreReviews);
        storage.setReviewsFromFirebase(firestoreReviews);
      }
    });

    // 10. Real-time Firestore sync for agency settings (Domicilio, horarios, portada)
    const unsubscribeAgency = firebaseSync.subscribeAgencySettings((firestoreAgency) => {
      if (firestoreAgency) {
        storage.setAgencySettingsFromFirebase(firestoreAgency);
        setAgencySettings(storage.getAgencySettings());
      }
    });

    // 10. Route sync
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/admin')) {
      setCurrentTab('admin');
    } else if (pathname.includes('/catalogo') || pathname.includes('/catalog')) {
      setCurrentTab('catalog');
    } else if (pathname.includes('/resenas') || pathname.includes('/reviews')) {
      setCurrentTab('reviews');
    } else if (pathname.includes('/ubicacion') || pathname.includes('/location')) {
      setCurrentTab('location');
    } else if (pathname.includes('/contacto') || pathname.includes('/contact')) {
      setCurrentTab('contact');
    }

    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('/admin')) setCurrentTab('admin');
      else if (p.includes('/catalogo') || p.includes('/catalog')) setCurrentTab('catalog');
      else if (p.includes('/resenas') || p.includes('/reviews')) setCurrentTab('reviews');
      else if (p.includes('/ubicacion') || p.includes('/location')) setCurrentTab('location');
      else if (p.includes('/contacto') || p.includes('/contact')) setCurrentTab('contact');
      else setCurrentTab('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      unsubscribeStorage();
      unsubscribeAuth();
      unsubscribeCars();
      unsubscribeReviews();
      unsubscribeAgency();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    clearDynamicAdminEmails();
    if (!currentUser?.emailVerified) return;

    const unsubscribeAccess = firebaseSync.subscribeAdminAccess(currentUser, () => {
      setAdminAccessVersion((version) => version + 1);
    });
    return () => {
      unsubscribeAccess();
      clearDynamicAdminEmails();
    };
  }, [currentUser?.uid, currentUser?.emailVerified]);

  useEffect(() => {
    if (!hasAdminAccess) return;

    const unsubscribeAdmins = firebaseSync.subscribeAdmins((items) => {
      storage.setAdminsFromFirebase(items);
    });
    const unsubscribeInquiries = firebaseSync.subscribeInquiries((items) => {
      setInquiries(items);
      storage.setInquiriesFromFirebase(items);
    });
    const unsubscribeCustomers = firebaseSync.subscribeCustomers((items) => {
      storage.setCustomersFromFirebase(items);
    });
    const unsubscribeQuotations = firebaseSync.subscribeQuotations((items) => {
      storage.setQuotationsFromFirebase(items);
    });
    const unsubscribeExpenses = firebaseSync.subscribeExpenses((items) => {
      storage.setExpensesFromFirebase(items);
    });

    return () => {
      unsubscribeAdmins();
      unsubscribeInquiries();
      unsubscribeCustomers();
      unsubscribeQuotations();
      unsubscribeExpenses();
    };
  }, [currentUser?.uid, hasAdminAccess]);

  const handleNavigate = (tab: string, filters?: any) => {
    setCurrentTab(tab);
    if (filters) {
      setCatalogInitialFilters(filters);
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL silently
    let newPath = '/';
    if (tab === 'admin') newPath = '/admin';
    else if (tab === 'catalog') newPath = '/catalogo';
    else if (tab === 'reviews') newPath = '/resenas';
    else if (tab === 'location') newPath = '/ubicacion';
    else if (tab === 'contact') newPath = '/contacto';

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Navigation Header */}
      <Navbar 
        currentTab={currentTab} 
        onNavigate={handleNavigate} 
        carCount={cars.filter(c => c.status === 'Disponible').length}
        user={currentUser}
        onSignIn={() => handleOpenAuth('login')}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 ${currentTab === 'admin' ? 'max-w-[1680px] pt-4 sm:pt-6' : 'max-w-7xl pt-6 sm:pt-8'}`}>
        {currentTab === 'home' && (
          <HomeView 
            cars={cars} 
            onSelectCar={(car) => setSelectedCar(car)} 
            onNavigate={handleNavigate}
            agencySettings={agencySettings}
          />
        )}

        {currentTab === 'catalog' && (
          <CatalogView 
            cars={cars} 
            onSelectCar={(car) => setSelectedCar(car)}
            initialFilters={catalogInitialFilters}
          />
        )}

        {currentTab === 'reviews' && (
          <ReviewsView 
            reviews={reviews} 
            onReviewAdded={loadData}
          />
        )}

        {currentTab === 'location' && (
          <LocationView agencySettings={agencySettings} />
        )}

        {currentTab === 'contact' && (
          <ContactView agencySettings={agencySettings} />
        )}

        {currentTab === 'admin' && (
          <AdminView 
            cars={cars} 
            reviews={reviews} 
            inquiries={inquiries} 
            onDataChanged={loadData}
            user={currentUser}
            onSignInWithGoogle={handleSignIn}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer (Hidden in Admin View for dedicated dashboard experience) */}
      {currentTab !== 'admin' && <Footer onNavigate={handleNavigate} agencySettings={agencySettings} />}

      {/* Vehicle Detail Modal */}
      <CarDetailModal 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)}
      />

      {/* Floating WhatsApp Action Button (Hidden in Admin View) */}
      {currentTab !== 'admin' && (
        <FloatingWhatsApp 
          phoneNumber={agencySettings.whatsappClean} 
          defaultMessage={agencySettings.whatsappDefaultMessage} 
        />
      )}

      {/* Secure Multi-Method Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(user) => {
          if (isUserAdmin(user) && currentTab !== 'admin') {
            handleNavigate('admin');
          }
        }}
      />
    </div>
  );
}
