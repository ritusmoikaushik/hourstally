// Google Analytics 4 (property hourstally.com, stream G-53J8ESQ8KZ), added 2026-10-31.
// Cloudflare Web Analytics samples 1 load in 10, too coarse to see single searchers, and
// Mediavine Journey counts sessions in GA4.
//
// Consent: the UK and EEA need a visitor's yes before analytics cookies. There Google's
// consent mode starts at "denied" (GA gets cookieless pings, no cookie is set) and a bar asks.
// Everywhere else analytics is on. Ads storage is denied everywhere: there are no ads yet.
// Google decides the region by IP; the bar is shown by time zone, which needs no lookup.
//
// Events: only which button was pressed and on which page. Nothing typed into a calculator
// is ever sent: no times, no rates, no names.
(function () {
  var ID = 'G-53J8ESQ8KZ';
  var KEY = 'ht-consent';
  var CONSENT_REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'IS', 'LI', 'NO', 'GB', 'CH'];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  var DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', Object.assign({ analytics_storage: 'denied', region: CONSENT_REGIONS }, DENIED));
  gtag('consent', 'default', Object.assign({ analytics_storage: 'granted' }, DENIED));
  if (saved) gtag('consent', 'update', { analytics_storage: saved });

  gtag('js', new Date());
  gtag('config', ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  // The buttons every tool shares. Same ids on every page, so one listener covers them all.
  var EVENTS = {
    'btn-xlsx': 'download_xlsx',
    'btn-print': 'print_card',
    'btn-print-chart': 'print_chart',
    'btn-copy': 'copy_result',
    'btn-clear': 'clear_card'
  };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button[id]');
    if (b && EVENTS[b.id]) gtag('event', EVENTS[b.id], { page_path: location.pathname });
  });

  function inConsentZone() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return /^Europe\//.test(tz) || /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz);
  }

  function choose(value, bar) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    gtag('consent', 'update', { analytics_storage: value });
    bar.remove();
  }

  function showBar() {
    var bar = document.createElement('div');
    bar.className = 'consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie choice');
    bar.innerHTML =
      '<p>May we count your visit with Google Analytics? It sets a cookie. It never sees what you type. ' +
      '<a href="/privacy">Privacy</a></p>' +
      '<div class="consent-btns"><button class="btn" type="button" data-v="granted">Yes</button>' +
      '<button class="btn quiet" type="button" data-v="denied">No</button></div>';
    bar.addEventListener('click', function (ev) {
      var v = ev.target.getAttribute && ev.target.getAttribute('data-v');
      if (v) choose(v, bar);
    });
    document.body.appendChild(bar);
  }

  if (!saved && inConsentZone()) {
    if (document.body) showBar();
    else document.addEventListener('DOMContentLoaded', showBar);
  }
})();
