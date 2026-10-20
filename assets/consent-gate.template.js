/*
 * Consent gate: loads Google Analytics 4 and/or Microsoft Clarity only after the
 * visitor clicks "Allow analytics". Build it with bin/build-consent-gate.mjs,
 * which fills in your validated settings below.
 */
(function () {
  'use strict';

  var CONFIG = __CONFIG__;
  var P = CONFIG.prefix;
  var CONSENT_MAX_AGE_MS = 390 * 24 * 60 * 60 * 1000; // about 13 months
  var ATTR_CLARITY = 'data-' + P + '-clarity';
  var ATTR_GA4 = 'data-' + P + '-ga4';
  var ATTR_CHOICES = 'data-' + P + '-privacy-choices';
  var PROMPT_ID = P + '-analytics-consent';

  // Analytics never runs on localhost, previews or any host not listed.
  if (CONFIG.productionHosts.indexOf(window.location.hostname) === -1) return;

  function readConsent() {
    try {
      var stored = window.localStorage.getItem(CONFIG.storageKey);
      if (!stored) return null;
      // Re-prompt for malformed choices and choices older than about 13 months.
      var choice = JSON.parse(stored);
      if (!choice || !choice.value || !choice.decidedAt) return null;
      if (Date.now() - choice.decidedAt > CONSENT_MAX_AGE_MS) return null;
      return choice.value;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONFIG.storageKey, JSON.stringify({ value: value, decidedAt: Date.now() }));
    } catch (error) {
      /* The choice still applies for this page load. */
    }
  }

  function signalClarity(value) {
    if (typeof window.clarity !== 'function') return;
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: value === 'granted' ? 'granted' : 'denied'
    });
  }

  function loadClarity() {
    if (!CONFIG.clarityProjectId) return;
    if (document.querySelector('script[' + ATTR_CLARITY + ']')) {
      signalClarity('granted');
      return;
    }
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    // Queue consent before the tag runs, so Clarity has the choice before it uses storage.
    signalClarity('granted');
    var script = document.createElement('script');
    script.async = true;
    script.setAttribute(ATTR_CLARITY, 'true');
    script.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(CONFIG.clarityProjectId);
    document.head.appendChild(script);
  }

  function loadGoogleAnalytics() {
    if (!CONFIG.ga4MeasurementId) return;
    if (document.querySelector('script[' + ATTR_GA4 + ']')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.ga4MeasurementId, { cookie_flags: 'SameSite=None;Secure' });
    var script = document.createElement('script');
    script.async = true;
    script.setAttribute(ATTR_GA4, 'true');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4MeasurementId);
    document.head.appendChild(script);
  }

  function removePrompt() {
    var prompt = document.getElementById(PROMPT_ID);
    if (prompt) prompt.remove();
  }

  // GA sets its cookies on the widest domain it can (example.com when on www.example.com),
  // so expire them on the current host and on every parent domain.
  function clearAnalyticsCookies() {
    var parts = window.location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('; domain=.' + parts.slice(i).join('.'));
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        domains.forEach(function (domain) {
          document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax';
        });
      }
    });
  }

  function isPrivacyLink(a) {
    var href = a.getAttribute('href') || '';
    return href === CONFIG.privacyUrl || a.pathname === CONFIG.privacyUrl || /privacy(\.html)?\/?$/i.test(a.pathname || href);
  }

  function makeChoicesLink() {
    var link = document.createElement('a');
    link.href = '#privacy-choices';
    link.textContent = 'Privacy choices';
    link.setAttribute(ATTR_CHOICES, '');
    return link;
  }

  // Every page gets a way to change the choice: next to each footer privacy link, or in a footer we add.
  function installPrivacyChoicesLinks() {
    var footers = document.querySelectorAll('footer');
    if (footers.length === 0) {
      var legalFooter = document.createElement('footer');
      legalFooter.className = P + '-legal-footer';
      legalFooter.setAttribute('aria-label', 'Privacy links');
      var policy = document.createElement('a');
      policy.href = CONFIG.privacyUrl;
      policy.textContent = 'Privacy Policy';
      legalFooter.appendChild(policy);
      document.body.appendChild(legalFooter);
      footers = [legalFooter];
    }

    Array.prototype.forEach.call(footers, function (footer) {
      if (footer.querySelector('[' + ATTR_CHOICES + ']')) return;
      var privacyLinks = Array.prototype.filter.call(footer.querySelectorAll('a[href]'), isPrivacyLink);
      if (privacyLinks.length > 0) privacyLinks[0].insertAdjacentElement('afterend', makeChoicesLink());
      else footer.appendChild(makeChoicesLink());
    });

    Array.prototype.forEach.call(document.querySelectorAll('[' + ATTR_CHOICES + ']'), function (control) {
      if (control.getAttribute('data-' + P + '-ready') === 'true') return;
      control.setAttribute('data-' + P + '-ready', 'true');
      control.addEventListener('click', function (event) {
        event.preventDefault();
        showPrompt(true);
      });
    });
  }

  function choose(value) {
    var trackerWasLoaded = Boolean(document.querySelector('script[' + ATTR_CLARITY + '], script[' + ATTR_GA4 + ']'));
    writeConsent(value);
    removePrompt();
    if (value === 'granted') {
      loadClarity();
      loadGoogleAnalytics();
      return;
    }
    signalClarity('denied');
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' });
    if (typeof window.clarity === 'function') window.clarity('consent', false);
    clearAnalyticsCookies();
    // Reload without the tags so nothing keeps collecting after a visitor withdraws.
    if (trackerWasLoaded) window.location.reload();
  }

  function describeTools() {
    var parts = [];
    if (CONFIG.ga4MeasurementId) parts.push('Google Analytics measures how the site is used');
    if (CONFIG.clarityProjectId) parts.push('Microsoft Clarity records interactions such as clicks and scrolling');
    return 'With your permission, ' + parts.join(', and ') + '. ' + (CONFIG.maskingSentence || '');
  }

  function showPrompt(isPreferences) {
    if (document.getElementById(PROMPT_ID)) return;
    var prompt = document.createElement('section');
    prompt.id = PROMPT_ID;
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'false');
    prompt.setAttribute('aria-labelledby', P + '-analytics-title');

    var text = document.createElement('div');
    var title = document.createElement('strong');
    title.id = P + '-analytics-title';
    title.textContent = isPreferences ? 'Privacy choices' : 'Help us improve ' + CONFIG.productName;
    var body = document.createElement('p');
    body.textContent = describeTools().trim();
    var policy = document.createElement('a');
    policy.href = CONFIG.privacyUrl;
    policy.textContent = 'Read our privacy policy';
    text.appendChild(title);
    text.appendChild(body);
    text.appendChild(policy);

    var actions = document.createElement('div');
    actions.className = P + '-consent-actions';
    [['denied', 'No thanks'], ['granted', 'Allow analytics']].forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-consent', choice[0]);
      button.textContent = choice[1];
      button.addEventListener('click', function () { choose(choice[0]); });
      actions.appendChild(button);
    });

    prompt.appendChild(text);
    prompt.appendChild(actions);
    document.body.appendChild(prompt);
  }

  function addStyles() {
    var id = '#' + PROMPT_ID;
    var style = document.createElement('style');
    style.textContent =
      id + '{position:fixed;z-index:2147483646;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:760px;margin:0 auto;padding:16px 18px;border:1px solid #ded9f7;border-radius:14px;background:#fff;color:#171520;box-shadow:0 12px 40px rgba(31,24,61,.18);font:14px/1.45 system-ui,sans-serif}' +
      id + ' strong{display:block;margin-bottom:4px;font-size:15px}' +
      id + ' p{margin:0;color:#59556a}' +
      id + ' a{display:inline-block;margin-top:5px;color:#4a2bd0;font-weight:700}' +
      '.' + P + '-consent-actions{display:flex;flex:0 0 auto;gap:8px}' +
      // Both buttons look the same: declining must be as easy and as visible as accepting.
      '.' + P + '-consent-actions button{min-height:44px;padding:0 16px;border:1px solid #302c3d;border-radius:9px;background:#fff;color:#171520;cursor:pointer;font:700 14px/1 system-ui,sans-serif}' +
      '.' + P + '-consent-actions button:focus-visible,[' + ATTR_CHOICES + ']:focus-visible{outline:3px solid #4a2bd0;outline-offset:3px}' +
      '.' + P + '-legal-footer{display:flex;justify-content:center;gap:16px;max-width:640px;margin:32px auto 0;padding:20px 24px;border-top:1px solid #ebeaf2;color:#5f5e6b;font:600 12px/1.4 system-ui,sans-serif}' +
      '.' + P + '-legal-footer a{color:inherit}' +
      '@media(max-width:620px){' + id + '{align-items:stretch;flex-direction:column;gap:12px}.' + P + '-consent-actions{justify-content:stretch}.' + P + '-consent-actions button{flex:1}}';
    document.head.appendChild(style);
  }

  function initialise() {
    addStyles();
    installPrivacyChoicesLinks();
    var consent = readConsent();
    if (consent === 'granted') {
      loadClarity();
      loadGoogleAnalytics();
    } else if (consent !== 'denied') {
      showPrompt(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
