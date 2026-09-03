import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Car, Review, Inquiry } from './types';
import { storage } from './utils/storage';
import { auth, signInWithGoogle, logOut, firebaseSync, isUserAdmin } from './firebase';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [cars, setCars] = useState<Car[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [catalogInitialFilters, setCatalogInitialFilters] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync state from storage
  const loadData = () => {
    setCars(storage.getCars());
    setReviews(storage.getReviews());
    setInquiries(storage.getInquiries());
  };

  useEffect(() => {
    loadData();

    // 1. Subscribe to local storage notify events
    const unsubscribeStorage = storage.subscribe(() => {
      loadData();
    });

    // 2. Firebase Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // 3. Ensure Firestore initial seed if collection is empty
    firebaseSync.ensureSeedData().catch((err) => {
      console.warn('Firebase initial seed check:', err);
    });

    // 4. Real-time Firestore sync for cars
    const unsubscribeCars = firebaseSync.subscribeCars((firestoreCars) => {
      if (firestoreCars && firestoreCars.length > 0) {
        setCars(firestoreCars);
        storage.setCarsFromFirebase(firestoreCars);
      }
    });

    // 5. Real-time Firestore sync for reviews
    const unsubscribeReviews = firebaseSync.subscribeReviews((firestoreReviews) => {
      if (firestoreReviews && firestoreReviews.length > 0) {
        setReviews(firestoreReviews);
        storage.setReviewsFromFirebase(firestoreReviews);
      }
    });

    // 6. Real-time Firestore sync for inquiries
    const unsubscribeInquiries = firebaseSync.subscribeInquiries((firestoreInquiries) => {
      if (firestoreInquiries) {
        setInquiries(firestoreInquiries);
        storage.setInquiriesFromFirebase(firestoreInquiries);
      }
    });

    // 7. Real-time Firestore sync for customers
    const unsubscribeCustomers = firebaseSync.subscribeCustomers((firestoreCustomers) => {
      if (firestoreCustomers && firestoreCustomers.length > 0) {
        storage.setCustomersFromFirebase(firestoreCustomers);
      }
    });

    // 8. Real-time Firestore sync for quotations
    const unsubscribeQuotations = firebaseSync.subscribeQuotations((firestoreQuotations) => {
      if (firestoreQuotations && firestoreQuotations.length > 0) {
        storage.setQuotationsFromFirebase(firestoreQuotations);
      }
    });

    // 9. Route sync
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
      unsubscribeInquiries();
      unsubscribeCustomers();
      unsubscribeQuotations();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'home' && (
          <HomeView 
            cars={cars} 
            onSelectCar={(car) => setSelectedCar(car)} 
            onNavigate={handleNavigate}
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
          <LocationView />
        )}

        {currentTab === 'contact' && (
          <ContactView />
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
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Vehicle Detail Modal */}
      <CarDetailModal 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)}
      />

      {/* Floating WhatsApp Action Button (Hidden in Admin View) */}
      {currentTab !== 'admin' && <FloatingWhatsApp />}
    </div>
  );
}
