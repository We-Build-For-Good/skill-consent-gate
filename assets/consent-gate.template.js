(function () {
  'use strict';

  var PROJECT_ID = '__CLARITY_PROJECT_ID__';
  var GA4_MEASUREMENT_ID = '__GA4_MEASUREMENT_ID__';
  var CONSENT_KEY = '__CONSENT_STORAGE_KEY__';
  var CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;
  var PRODUCTION_HOSTS = [__PRODUCTION_HOSTS__];

  if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return;

  function readConsent() {
    try {
      var stored = window.localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;
      // Re-prompt legacy string choices and choices older than 13 months.
      var choice = JSON.parse(stored);
      if (!choice || !choice.value || !choice.decidedAt) return null;
      if (Date.now() - choice.decidedAt > CONSENT_MAX_AGE_MS) return null;
      return choice.value;
    }
    catch (error) { return null; }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        value: value,
        decidedAt: Date.now()
      }));
    }
    catch (error) { /* The choice still applies for this page load. */ }
  }

  function signalConsent(value) {
    if (typeof window.clarity !== 'function') return;
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: value === 'granted' ? 'granted' : 'denied'
    });
  }

  function loadClarity() {
    if (document.querySelector('script[data-__PREFIX__-clarity]')) {
      signalConsent('granted');
      return;
    }

    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

    // Queue consent before the asynchronous tag executes so Clarity receives
    // the visitor's choice before it attempts to use analytics storage.
    signalConsent('granted');

    var script = document.createElement('script');
    script.async = true;
    script.dataset.__PREFIX_CAMEL__Clarity = 'true';
    script.src = 'https://www.clarity.ms/tag/' + PROJECT_ID;
    document.head.appendChild(script);
  }

  function loadGoogleAnalytics() {
    if (document.querySelector('script[data-__PREFIX__-ga4]')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    var script = document.createElement('script');
    script.async = true;
    script.dataset.__PREFIX_CAMEL__Ga4 = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function removePrompt() {
    var prompt = document.getElementById('__PREFIX__-analytics-consent');
    if (prompt) prompt.remove();
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
        document.cookie = name + '=; Max-Age=0; path=/; domain=.' + window.location.hostname + '; SameSite=Lax';
      }
    });
  }

  function installPrivacyChoicesLinks() {
    if (!document.querySelector('footer')) {
      var legalFooter = document.createElement('footer');
      legalFooter.className = '__PREFIX__-legal-footer';
      legalFooter.setAttribute('aria-label', 'Privacy links');
      legalFooter.innerHTML = '<a href="__PRIVACY_URL__">Privacy Policy</a>';
      document.body.appendChild(legalFooter);
    }

    document.querySelectorAll('footer a[href$="privacy.html"]').forEach(function (privacyLink) {
      if (privacyLink.parentElement.querySelector('[data-__PREFIX__-privacy-choices]')) return;
      var link = document.createElement('a');
      link.href = '#privacy-choices';
      link.textContent = 'Privacy choices';
      link.setAttribute('data-__PREFIX__-privacy-choices', '');
      privacyLink.insertAdjacentElement('afterend', link);
    });

    document.querySelectorAll('[data-__PREFIX__-privacy-choices]').forEach(function (control) {
      if (control.dataset.__PREFIX_CAMEL__PrivacyReady === 'true') return;
      control.dataset.__PREFIX_CAMEL__PrivacyReady = 'true';
      control.addEventListener('click', function (event) {
        event.preventDefault();
        showPrompt(true);
      });
    });
  }

  function choose(value) {
    var clarityWasLoaded = Boolean(document.querySelector('script[data-__PREFIX__-clarity]'));
    writeConsent(value);
    removePrompt();
    if (value === 'granted') {
      loadClarity();
      loadGoogleAnalytics();
    } else {
      signalConsent('denied');
      clearAnalyticsCookies();
      // Clear any Clarity cookies if a visitor withdraws earlier consent.
      if (typeof window.clarity === 'function') window.clarity('consent', false);
      // Reload without the tag so no cookieless collection continues after a
      // visitor withdraws consent during an active recorded session.
      if (clarityWasLoaded) {
        window.location.reload();
        return;
      }
    }
  }

  function showPrompt(isPreferences) {
    if (document.getElementById('__PREFIX__-analytics-consent')) return;

    var prompt = document.createElement('section');
    prompt.id = '__PREFIX__-analytics-consent';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'false');
    prompt.setAttribute('aria-labelledby', '__PREFIX__-analytics-title');
    prompt.innerHTML =
      '<div>' +
        '<strong id="__PREFIX__-analytics-title">' + (isPreferences ? 'Privacy choices' : 'Help us improve __PRODUCT_NAME__') + '</strong>' +
        '<p>With your permission, Google Analytics measures aggregate usage and Microsoft Clarity records interactions such as clicks and scrolling. __MASKING_SENTENCE__</p>' +
        '<a href="__PRIVACY_URL__">Read our privacy policy</a>' +
      '</div>' +
      '<div class="__PREFIX__-consent-actions">' +
        '<button type="button" data-consent="denied">No thanks</button>' +
        '<button type="button" data-consent="granted">Allow analytics</button>' +
      '</div>';

    prompt.querySelector('[data-consent="denied"]').addEventListener('click', function () { choose('denied'); });
    prompt.querySelector('[data-consent="granted"]').addEventListener('click', function () { choose('granted'); });
    document.body.appendChild(prompt);
  }

  function addStyles() {
    var style = document.createElement('style');
    style.textContent =
      '#__PREFIX__-analytics-consent{position:fixed;z-index:2147483646;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:760px;margin:0 auto;padding:16px 18px;border:1px solid #ded9f7;border-radius:14px;background:#fff;color:#171520;box-shadow:0 12px 40px rgba(31,24,61,.18);font:14px/1.45 Inter,system-ui,sans-serif}' +
      '#__PREFIX__-analytics-consent strong{display:block;margin-bottom:4px;font-size:15px}' +
      '#__PREFIX__-analytics-consent p{margin:0;color:#59556a}' +
      '#__PREFIX__-analytics-consent a{display:inline-block;margin-top:5px;color:#5b35f5;font-weight:700}' +
      '.__PREFIX__-consent-actions{display:flex;flex:0 0 auto;gap:8px}' +
      '.__PREFIX__-consent-actions button{border:1px solid #d9d4e8;border-radius:9px;background:#fff;color:#302c3d;cursor:pointer;font:700 13px/1 Inter,system-ui,sans-serif}' +
      '.__PREFIX__-consent-actions button{min-height:38px;padding:0 14px}' +
      '.__PREFIX__-consent-actions [data-consent="granted"]{border-color:#5b35f5;background:#5b35f5;color:#fff}' +
      '[data-__PREFIX__-privacy-choices]:focus-visible{outline:3px solid #8b6df0;outline-offset:3px;border-radius:3px}' +
      '.__PREFIX__-legal-footer{display:flex;justify-content:center;gap:16px;max-width:640px;margin:32px auto 0;padding:20px 24px;border-top:1px solid #ebeaf2;color:#74737f;font:600 12px/1.4 Inter,system-ui,sans-serif}' +
      '.__PREFIX__-legal-footer a{color:inherit;text-decoration:none}.__PREFIX__-legal-footer a:hover{text-decoration:underline}' +
      '@media(max-width:620px){#__PREFIX__-analytics-consent{align-items:stretch;flex-direction:column;gap:12px}.__PREFIX__-consent-actions{justify-content:flex-end}}';
    document.head.appendChild(style);
  }

  function initialise() {
    addStyles();
    installPrivacyChoicesLinks();
    var consent = readConsent();
    if (consent === 'granted') {
      loadClarity();
      loadGoogleAnalytics();
    }
    if (consent !== 'granted' && consent !== 'denied') showPrompt(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
