import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import DocsPage from './pages/DocsPage';

function App() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header onSearchClick={() => setIsCommandOpen(true)} />
        <DocsPage isCommandOpen={isCommandOpen} onCommandClose={() => setIsCommandOpen(false)} />
      </div>
    </ThemeProvider>
  );
}

export default App;
