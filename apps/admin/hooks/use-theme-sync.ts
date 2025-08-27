"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useConfig } from "@/lib/config";

export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { config, updateThemeConfig } = useConfig();

  // Sync theme changes with config service
  useEffect(() => {
    if (theme && theme !== config.theme.mode) {
      updateThemeConfig({ mode: theme as 'light' | 'dark' | 'system' });
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
    const actualTheme = newTheme === 'system' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      newTheme;
    
    setTheme(actualTheme);
    updateThemeConfig({ mode: actualTheme as 'light' | 'dark' });
  };

  // Get the actual theme (light/dark) even when system is selected
  const actualTheme = theme === 'system' ? 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
    theme;

  return {
    theme: actualTheme,
    setTheme: handleThemeChange,
    configTheme: config.theme,
  };
}
