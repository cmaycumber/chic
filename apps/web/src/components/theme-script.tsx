export function ThemeScript() {
  const themeScript = `
    try {
      const theme = localStorage.getItem('theme') || 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for preventing theme flash on page load - content is not user-generated
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
