/* NÁŘEZÁKFEST: měření pouze po příslušném souhlasu. */
(() => {
  'use strict';
  const GA_ID = 'G-01BMKJBFD2';
  // Vyplnit pouze ověřené ID Meta Pixelu NÁŘEZÁKFEST; prázdné = Meta vypnutá.
  const META_ID = '';
  const KEY = 'narezakfest_cookie_consent';
  const disableKey = 'ga-disable-' + GA_ID;
  const hasMeta = /^\d{5,25}$/.test(META_ID);
  let consent = readConsent();
  let gaLoaded = false, metaLoaded = false;
  let previousFocus;
  const banner = document.getElementById('cookieConsent');
  const details = document.getElementById('cookieDetails');
  const analytics = document.getElementById('cookieAnalytics');
  const marketing = document.getElementById('cookieMarketing');
  const customize = document.getElementById('cookieCustomize');
  const background = [...document.body.children].filter(el => el !== banner && !['SCRIPT','STYLE'].includes(el.tagName));
  const priorInert = new Map();

  function readConsent() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch {}
    if (raw === null) { try { raw = sessionStorage.getItem(KEY); } catch {} }
    if (raw === 'granted' || raw === 'denied') return {analytics: raw === 'granted', marketing: false};
    try {
      const value = JSON.parse(raw);
      if (value && value.version === 2 && typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean') return value;
    } catch {}
    return null;
  }
  function writeConsent(value) {
    const raw = JSON.stringify({version:2,analytics:value.analytics,marketing:value.marketing});
    try { localStorage.setItem(KEY,raw); try { sessionStorage.removeItem(KEY); } catch {} return; } catch {}
    try { sessionStorage.setItem(KEY,raw); } catch {}
  }
  function deleteCookies(pattern) {
    const root = location.hostname.replace(/^www\./,'');
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!pattern.test(name)) return;
      ['', location.hostname, '.' + location.hostname, root, '.' + root].forEach(domain => {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      });
    });
  }
  function startAnalytics() {
    if (gaLoaded || !consent?.analytics) return;
    gaLoaded = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',GA_ID,{send_page_view:true,allow_google_signals:false,allow_ad_personalization_signals:false});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    script.dataset.narezakfestGa = 'true';
    document.head.appendChild(script);
  }
  function startMeta() {
    if (metaLoaded || !hasMeta || !consent?.marketing) return;
    metaLoaded = true;
    const fbq = window.fbq = function(){fbq.callMethod ? fbq.callMethod.apply(fbq,arguments) : fbq.queue.push(arguments);};
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    fbq('consent','grant');
    fbq('set','autoConfig',false,META_ID);
    fbq('init',META_ID);
    fbq('trackSingle',META_ID,'PageView');
    const script = document.createElement('script');
    script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.dataset.narezakfestMeta = 'true';
    document.head.appendChild(script);
  }
  function closeBanner() {
    if (!banner) return;
    banner.hidden = true; details.hidden = true;
    customize.setAttribute('aria-expanded','false');
    document.body.classList.remove('consent-open');
    if (location.hash === '#nastaveni-cookies') history.replaceState(null,'',location.pathname + location.search);
    background.forEach(el => { if (priorInert.has(el)) el.inert = priorInert.get(el); });
    priorInert.clear();
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  }
  function openBanner(showDetails = true) {
    if (!banner) { location.href = '/#nastaveni-cookies'; return; }
    previousFocus = document.activeElement;
    analytics.checked = !!consent?.analytics;
    marketing.checked = hasMeta && !!consent?.marketing;
    banner.hidden = false; details.hidden = !showDetails;
    customize.setAttribute('aria-expanded',String(showDetails));
    document.body.classList.add('consent-open');
    background.forEach(el => { if (!priorInert.has(el)) priorInert.set(el,el.inert); el.inert = true; });
    (showDetails ? analytics : document.getElementById('cookieAccept')).focus({preventScroll:true});
  }
  function saveConsent(next) {
    next.marketing = hasMeta && next.marketing;
    const mustUnload = (gaLoaded && !next.analytics) || (metaLoaded && !next.marketing);
    consent = next;
    writeConsent(consent);
    window[disableKey] = !consent.analytics;
    if (!consent.analytics) deleteCookies(/^(_ga(?:_|$)|_gid$|_gat)/);
    if (!consent.marketing) {
      if (metaLoaded && window.fbq) window.fbq('consent','revoke');
      deleteCookies(/^(_fbp|_fbc)$/);
    }
    closeBanner();
    // Odstraní již načtené knihovny i jejich posluchače; další načtení respektuje uloženou volbu.
    if (mustUnload) { location.reload(); return; }
    startAnalytics(); startMeta();
  }
  window[disableKey] = !consent?.analytics;
  if (!consent?.analytics) deleteCookies(/^(_ga(?:_|$)|_gid$|_gat)/);
  if (!hasMeta || !consent?.marketing) deleteCookies(/^(_fbp|_fbc)$/);
  if (banner) {
    document.getElementById('cookieMarketingOption').hidden = !hasMeta;
    document.getElementById('cookieAccept').addEventListener('click',()=>saveConsent({analytics:true,marketing:hasMeta}));
    document.getElementById('cookieReject').addEventListener('click',()=>saveConsent({analytics:false,marketing:false}));
    document.getElementById('cookieSave').addEventListener('click',()=>saveConsent({analytics:analytics.checked,marketing:marketing.checked}));
    customize.addEventListener('click',()=>{details.hidden=!details.hidden;customize.setAttribute('aria-expanded',String(!details.hidden));});
    banner.addEventListener('keydown',event=>{
      if (event.key==='Escape' && consent) { event.preventDefault(); closeBanner(); }
      if (event.key!=='Tab') return;
      const focusable=[...banner.querySelectorAll('a,button,input')].filter(el=>el.getClientRects().length && !el.disabled);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    });
    if (!consent || location.hash === '#nastaveni-cookies') openBanner(!!consent);
  }
  document.querySelectorAll('[data-cookie-settings]').forEach(el=>el.addEventListener('click',()=>openBanner(true)));
  function hashSettings(){if(location.hash==='#nastaveni-cookies')openBanner(true);}
  window.addEventListener('hashchange',hashSettings);
  window.addEventListener('storage',event=>{
    if(event.key!==KEY && event.key!==null)return;
    const next=readConsent();
    if((gaLoaded && !next?.analytics)||(metaLoaded && !next?.marketing)){
      window[disableKey]=true;
      if(metaLoaded)window.fbq('consent','revoke');
      location.reload();return;
    }
    consent=next;startAnalytics();startMeta();
  });
  window.addEventListener('pageshow',event=>{
    if (!event.persisted) return;
    const next = readConsent();
    window[disableKey] = !next?.analytics;
    if ((gaLoaded && !next?.analytics) || (metaLoaded && !next?.marketing)) {
      if (metaLoaded) window.fbq('consent','revoke');
      location.reload(); return;
    }
    consent = next; startAnalytics(); startMeta();
  });
  startAnalytics();startMeta();
})();
