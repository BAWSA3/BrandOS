// BrandOS Chrome Extension — Content Script (X.com Badge Injection)

const BADGE_ATTR = 'data-brandos-badge';
const DEFERRED_ATTR = 'data-brandos-deferred';
const PROCESSED_ATTR = 'data-brandos-processed';

// DOM Selectors (centralized — update here when X changes DOM)
const SELECTORS = {
  profileUserName: '[data-testid="UserName"]',
  tweetUserName: '[data-testid="User-Name"]',
  tweet: 'article[data-testid="tweet"]',
};

// Score color tiers
function getScoreColor(score) {
  if (score >= 80) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 60) return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
  if (score >= 40) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

// ─── Username Extraction ─────────────────────────────────────────────────────

function extractUsername(element) {
  // Look for @username span inside the element
  const spans = element.querySelectorAll('span');
  for (const span of spans) {
    const text = span.textContent?.trim();
    if (text && text.startsWith('@') && text.length > 1) {
      return text.slice(1);
    }
  }

  // Fallback: look for link href
  const links = element.querySelectorAll('a[href^="/"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href && href.match(/^\/[a-zA-Z0-9_]+$/)) {
      return href.slice(1);
    }
  }

  return null;
}

// ─── Badge Creation ──────────────────────────────────────────────────────────

function createBadge(username) {
  const badge = document.createElement('span');
  badge.setAttribute(BADGE_ATTR, username);
  badge.className = 'brandos-badge brandos-badge--loading';
  badge.textContent = '...';
  badge.title = 'BrandOS Score — Loading...';
  badge.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleBadgeClick(badge, username);
  });
  return badge;
}

function updateBadge(badge, scoreData) {
  if (scoreData.error) {
    badge.className = 'brandos-badge brandos-badge--error';
    badge.textContent = '?';
    badge.title = scoreData.error === 'not_authenticated'
      ? 'BrandOS — Sign in to see scores'
      : 'BrandOS — Score unavailable';
    return;
  }

  const { color, bg } = getScoreColor(scoreData.overallScore);
  badge.className = 'brandos-badge';
  badge.textContent = scoreData.overallScore;
  badge.title = `BrandOS Score: ${scoreData.overallScore} — ${scoreData.archetype?.primary || 'Unknown'}`;
  badge.style.setProperty('--brandos-color', color);
  badge.style.setProperty('--brandos-bg', bg);
}

// ─── Badge Injection ─────────────────────────────────────────────────────────

function injectBadges(root = document) {
  // Profile page
  const profileNames = root.querySelectorAll(SELECTORS.profileUserName);
  for (const el of profileNames) {
    processNameElement(el, true);
  }

  // Timeline tweets
  const tweetNames = root.querySelectorAll(SELECTORS.tweetUserName);
  for (const el of tweetNames) {
    processNameElement(el, false);
  }
}

function processNameElement(element, isProfile) {
  if (element.querySelector(`[${BADGE_ATTR}]`)) return; // Already has badge
  if (element.hasAttribute(PROCESSED_ATTR)) return;
  element.setAttribute(PROCESSED_ATTR, '');

  const username = extractUsername(element);
  if (!username) return;

  // Find the display name container to append badge after
  const displayNameContainer = element.querySelector('span')?.closest('div') || element;
  const badge = createBadge(username);
  displayNameContainer.appendChild(badge);

  if (isProfile) {
    // Profile badges fetch immediately
    requestScore(username, badge);
  } else {
    // Timeline badges use IntersectionObserver (lazy fetch)
    badge.setAttribute(DEFERRED_ATTR, '');
    observeBadge(badge, username);
  }
}

// ─── IntersectionObserver for Lazy Loading ───────────────────────────────────

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const badge = entry.target;
      const username = badge.getAttribute(BADGE_ATTR);
      if (username && badge.hasAttribute(DEFERRED_ATTR)) {
        badge.removeAttribute(DEFERRED_ATTR);
        observer.unobserve(badge);
        requestScore(username, badge);
      }
    }
  }
}, { rootMargin: '200px' }); // Start fetching slightly before visible

function observeBadge(badge, username) {
  observer.observe(badge);
}

// ─── Score Requests ──────────────────────────────────────────────────────────

function requestScore(username, badge) {
  chrome.runtime.sendMessage(
    { type: 'GET_SCORE', username },
    (response) => {
      if (chrome.runtime.lastError) {
        updateBadge(badge, { error: 'extension_error' });
        return;
      }
      if (response?.data) {
        updateBadge(badge, response.data);
      }
    }
  );
}

// ─── Dropdown Panel ──────────────────────────────────────────────────────────

let activeDropdown = null;

function handleBadgeClick(badge, username) {
  // Close any existing dropdown
  closeDropdown();

  const scoreData = badge.textContent;
  if (scoreData === '...' || scoreData === '?') {
    // No data yet — request it
    requestScore(username, badge);
    return;
  }

  // Fetch fresh data for dropdown
  chrome.runtime.sendMessage(
    { type: 'GET_SCORE', username },
    (response) => {
      if (chrome.runtime.lastError || !response?.data || response.data.error) return;
      showDropdown(badge, response.data);
    }
  );
}

function showDropdown(badge, data) {
  closeDropdown();

  const dropdown = document.createElement('div');
  dropdown.className = 'brandos-dropdown';
  dropdown.innerHTML = buildDropdownHTML(data);

  // Position below badge
  const rect = badge.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.left = `${Math.max(8, rect.left - 140)}px`;
  dropdown.style.zIndex = '10001';

  // Detect dark mode
  const bgColor = getComputedStyle(document.body).backgroundColor;
  const isDark = isDarkColor(bgColor);
  dropdown.setAttribute('data-theme', isDark ? 'dark' : 'light');

  document.body.appendChild(dropdown);
  activeDropdown = dropdown;

  // CTA link
  const ctaLink = dropdown.querySelector('.brandos-dropdown__cta');
  if (ctaLink) {
    ctaLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'GET_SCORE', username: data.username }, () => {});
      window.open(data.scoreUrl || `http://localhost:3000/score/${data.username}`, '_blank');
    });
  }

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
  }, 10);
}

function buildDropdownHTML(data) {
  const { color } = getScoreColor(data.overallScore);
  const phases = data.phases || {};

  return `
    <div class="brandos-dropdown__header">
      <div class="brandos-dropdown__score-circle" style="--score-color: ${color}">
        <span class="brandos-dropdown__score-value">${data.overallScore}</span>
      </div>
      <div class="brandos-dropdown__meta">
        <div class="brandos-dropdown__archetype">
          ${data.archetype?.emoji || ''} ${data.archetype?.primary || 'Unknown'}
        </div>
        <div class="brandos-dropdown__tagline">${data.archetype?.tagline || ''}</div>
        <div class="brandos-dropdown__tier">${formatTier(data.influenceTier)}</div>
      </div>
    </div>

    <div class="brandos-dropdown__phases">
      ${phaseBar('Define', phases.define?.score, phases.define?.topInsight)}
      ${phaseBar('Check', phases.check?.score, phases.check?.topInsight)}
      ${phaseBar('Generate', phases.generate?.score, phases.generate?.topInsight)}
      ${phaseBar('Scale', phases.scale?.score, phases.scale?.topInsight)}
    </div>

    ${data.contentStyle?.topics?.length ? `
      <div class="brandos-dropdown__topics">
        ${data.contentStyle.topics.map(t => `<span class="brandos-dropdown__tag">${t}</span>`).join('')}
      </div>
    ` : ''}

    <a class="brandos-dropdown__cta" href="#">Full analysis on BrandOS &rarr;</a>
  `;
}

function phaseBar(name, score, insight) {
  score = score || 0;
  const { color } = getScoreColor(score);
  return `
    <div class="brandos-dropdown__phase">
      <div class="brandos-dropdown__phase-header">
        <span class="brandos-dropdown__phase-name">${name}</span>
        <span class="brandos-dropdown__phase-score" style="color: ${color}">${score}</span>
      </div>
      <div class="brandos-dropdown__phase-bar">
        <div class="brandos-dropdown__phase-fill" style="width: ${score}%; background: ${color}"></div>
      </div>
      ${insight && !insight.startsWith('Cached') && !insight.startsWith('Quick') ? `<div class="brandos-dropdown__phase-insight">${insight}</div>` : ''}
    </div>
  `;
}

function formatTier(tier) {
  if (!tier) return '';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function isDarkColor(bgColor) {
  const match = bgColor.match(/\d+/g);
  if (!match || match.length < 3) return true;
  const [r, g, b] = match.map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
}

function handleClickOutside(e) {
  if (activeDropdown && !activeDropdown.contains(e.target) && !e.target.hasAttribute(BADGE_ATTR)) {
    closeDropdown();
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    closeDropdown();
  }
}

// ─── MutationObserver (React SPA — handles virtual scrolling) ────────────────

const mutationObserver = new MutationObserver((mutations) => {
  let shouldScan = false;

  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldScan = true;
      break;
    }
  }

  if (shouldScan) {
    // Debounce scanning to avoid excessive DOM queries
    clearTimeout(mutationObserver._debounceTimer);
    mutationObserver._debounceTimer = setTimeout(() => {
      injectBadges(document);
    }, 150);
  }
});

// ─── Listen for auth from extension-auth page ────────────────────────────────

window.addEventListener('message', (event) => {
  if (event.data?.type === 'BRANDOS_AUTH_TOKENS') {
    chrome.runtime.sendMessage({
      type: 'AUTH_TOKENS',
      accessToken: event.data.accessToken,
      refreshToken: event.data.refreshToken,
    });
  }
});

// ─── Initialize ──────────────────────────────────────────────────────────────

function init() {
  // Initial scan
  injectBadges(document);

  // Watch for DOM changes (X's React SPA + virtual scrolling)
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
