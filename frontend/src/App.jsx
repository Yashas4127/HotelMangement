import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from './context/AppContext.jsx';
import { TripProvider } from './context/TripContext.jsx';
import { CompareProvider } from './context/CompareContext.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { useApp } from './context/AppContext.jsx';

function ServerError() {
  const { error, clearError } = useApp();
  if (!error) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-2xl items-start justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg" role="alert">
      <span>{error}</span>
      <button type="button" className="font-bold underline" onClick={clearError}>Dismiss</button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppProvider><TripProvider><CompareProvider><ServerError /><AppRoutes /></CompareProvider></TripProvider></AppProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}
