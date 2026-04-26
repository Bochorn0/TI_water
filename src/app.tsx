import 'src/global.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Router } from 'src/routes';
import { ThemeProvider } from 'src/theme/theme-provider';
import { AuthProvider } from 'src/auth/auth-context';
import { QuoteDraftProvider } from 'src/quote/quote-draft-context';
import { SiteVisitTracker } from 'src/components/site-visit-tracker';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <QuoteDraftProvider>
      <SiteVisitTracker />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router />
      </QuoteDraftProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

