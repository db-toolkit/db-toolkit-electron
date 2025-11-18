/**
 * Appearance settings component
 */
import { Input } from '../common/Input';
import { useTheme } from '../../contexts/ThemeContext';

export function AppearanceSettings({ settings, onChange }) {
  const { updateTheme } = useTheme();

  const handleThemeChange = (value) => {
    onChange('theme', value);
    updateTheme(value);
  };
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <select
          value={settings.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <Input
        label="Editor Font Size"
        type="number"
        value={settings.editor_font_size}
        onChange={(e) => onChange('editor_font_size', parseInt(e.target.value))}
        min={10}
        max={24}
      />
    </div>
  );
}
