import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import DocsPage from './pages/DocsPage';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col pt-[72px] bg-white dark:bg-gray-900">
        <Header />
        <DocsPage />
      </div>
    </ThemeProvider>
  );
}

export default App;
