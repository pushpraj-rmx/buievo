"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useConfig } from "@/lib/config";

export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { config, updateThemeConfig } = useConfig();

  // Helper function to get actual theme (light/dark) from system theme
  const getActualTheme = (themeValue: string | undefined): 'light' | 'dark' => {
    if (themeValue === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light'; // fallback
    }
    return (themeValue as 'light' | 'dark') || 'light';
  };

  // Sync theme changes with config service
  useEffect(() => {
    if (theme && theme !== config.theme.mode) {
      const actualTheme = getActualTheme(theme);
      if (actualTheme !== config.theme.mode) {
        updateThemeConfig({ mode: actualTheme });
      }
    }
  }, [theme, config.theme.mode, updateThemeConfig]);

  // Sync config changes with next-themes
  useEffect(() => {
    if (config.theme.mode && config.theme.mode !== theme) {
      setTheme(config.theme.mode);
    }
  }, [config.theme.mode, theme, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    // If system theme is detected, convert to actual light/dark
    const actualTheme = getActualTheme(newTheme);
    
    setTheme(newTheme); // Keep the original theme (including 'system') for next-themes
    updateThemeConfig({ mode: actualTheme }); // But store actual light/dark in config
  };

  // Get the actual theme (light/dark) even when system is selected
  const actualTheme = getActualTheme(theme);

  return {
    theme: actualTheme,
    setTheme: handleThemeChange,
    configTheme: config.theme,
  };
}
