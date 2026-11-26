// Sets the colour theme before the first paint, so the page never flashes the
// wrong theme. Saved choice wins; otherwise the system setting is used.
// Kept as a separate file (not inline) so the Content-Security-Policy can stay strict.
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('nis_kitap_theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  }
  var root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1318' : '#f6f4ef');
})();
