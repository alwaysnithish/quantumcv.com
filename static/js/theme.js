/* QuantumCV — Theme Manager */
window.QTheme = (() => {
  const KEY = 'qcv-theme';

  function get() {
    return localStorage.getItem(KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);

    // Update all toggle knob icons
    document.querySelectorAll('.theme-icon-light').forEach(el => {
      el.style.display = theme === 'dark' ? 'none' : 'block';
    });
    document.querySelectorAll('.theme-icon-dark').forEach(el => {
      el.style.display = theme === 'dark' ? 'block' : 'none';
    });
  }

  function toggle() {
    apply(get() === 'dark' ? 'light' : 'dark');
  }

  // Apply immediately on load (before paint) to prevent flash
  apply(get());

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light');
  });

  return { get, apply, toggle };
})();
