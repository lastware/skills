import type { ThemeMode } from 'bref-ui/types';

/** Shared between the root ThemeModeToggle and the visible Select in the toolbar. */
export const themeState = $state<{ mode: ThemeMode }>({ mode: 'auto' });
