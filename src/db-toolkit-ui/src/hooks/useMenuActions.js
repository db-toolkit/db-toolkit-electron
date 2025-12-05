import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function useMenuActions() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    if (!window.electron?.onMenuAction) return;

    const handleMenuAction = (action, data) => {
      switch (action) {
        // File Menu
        case 'new-connection':
          navigate('/connections');
          break;
        case 'connect-recent':
          navigate(`/query/${data}`);
          break;
        case 'new-query-tab':
          // Handled by QueryPage
          window.dispatchEvent(new CustomEvent('menu:new-query-tab'));
          break;
        case 'close-tab':
          window.dispatchEvent(new CustomEvent('menu:close-tab'));
          break;
        case 'import-csv':
          window.dispatchEvent(new CustomEvent('menu:import-csv'));
          break;
        case 'export-results':
          window.dispatchEvent(new CustomEvent('menu:export-results'));
          break;

        // Edit Menu
        case 'find':
          window.dispatchEvent(new CustomEvent('menu:command-palette'));
          break;

        // View Menu
        case 'toggle-sidebar':
          window.dispatchEvent(new CustomEvent('menu:toggle-sidebar'));
          break;
        case 'toggle-terminal':
          window.dispatchEvent(new CustomEvent('menu:toggle-terminal'));
          break;
        case 'toggle-ai':
          window.dispatchEvent(new CustomEvent('menu:toggle-ai'));
          break;
        case 'toggle-theme':
          toggleTheme();
          break;

        // Database Menu
        case 'connect-database':
          navigate('/connections');
          break;
        case 'disconnect-database':
          window.dispatchEvent(new CustomEvent('menu:disconnect-database'));
          break;
        case 'refresh-schema':
          window.dispatchEvent(new CustomEvent('menu:refresh-schema'));
          break;
        case 'run-query':
          window.dispatchEvent(new CustomEvent('menu:run-query'));
          break;
        case 'stop-query':
          window.dispatchEvent(new CustomEvent('menu:stop-query'));
          break;
        case 'view-er-diagram':
          window.dispatchEvent(new CustomEvent('menu:view-er-diagram'));
          break;
        case 'analyze-schema':
          window.dispatchEvent(new CustomEvent('menu:analyze-schema'));
          break;

        // Tools Menu
        case 'open-migrations':
          navigate('/migrations');
          break;
        case 'open-backups':
          navigate('/backups');
          break;
        case 'open-analytics':
          navigate('/analytics');
          break;
        case 'command-palette':
          window.dispatchEvent(new CustomEvent('menu:command-palette'));
          break;

        // Help Menu
        case 'keyboard-shortcuts':
          window.dispatchEvent(new CustomEvent('menu:keyboard-shortcuts'));
          break;
        case 'report-issue':
          window.dispatchEvent(new CustomEvent('menu:report-issue'));
          break;

        default:
          console.log('Unhandled menu action:', action);
      }
    };

    window.electron.onMenuAction(handleMenuAction);

    return () => {
      window.electron.removeMenuActionListener?.();
    };
  }, [navigate, toggleTheme]);
}
