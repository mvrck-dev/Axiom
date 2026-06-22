import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface AccessibilityOptions {
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: number; // 100, 115, 130
  dyslexicFont: boolean;
}

interface AccessibilityContextType {
  options: AccessibilityOptions;
  setOption: <K extends keyof AccessibilityOptions>(key: K, value: AccessibilityOptions[K]) => void;
}

const DEFAULT_OPTIONS: AccessibilityOptions = {
  reduceMotion: false,
  highContrast: false,
  textScale: 100,
  dyslexicFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

function loadAccessibilityOptions(): AccessibilityOptions {
  try {
    const raw = localStorage.getItem('axiom:accessibility');
    if (!raw) return DEFAULT_OPTIONS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_OPTIONS, ...parsed };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<AccessibilityOptions>(() => loadAccessibilityOptions());

  useEffect(() => {
    localStorage.setItem('axiom:accessibility', JSON.stringify(options));

    // Handle high contrast document body class
    if (options.highContrast) {
      document.documentElement.classList.add('accessibility-high-contrast');
    } else {
      document.documentElement.classList.remove('accessibility-high-contrast');
    }

    // Handle dyslexic font document body class
    if (options.dyslexicFont) {
      document.documentElement.classList.add('accessibility-dyslexic');
    } else {
      document.documentElement.classList.remove('accessibility-dyslexic');
    }

    // Handle font scaling class
    document.documentElement.classList.remove('text-scale-100', 'text-scale-115', 'text-scale-130');
    document.documentElement.classList.add(`text-scale-${options.textScale}`);
  }, [options]);

  const setOption = <K extends keyof AccessibilityOptions>(key: K, value: AccessibilityOptions[K]) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <AccessibilityContext.Provider value={{ options, setOption }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
