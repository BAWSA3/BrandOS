// DOM Elements
const setupView = document.getElementById('setup-view');
const mainView = document.getElementById('main-view');
const serverUrlInput = document.getElementById('server-url');
const apiKeyInput = document.getElementById('api-key');
const saveSettingsBtn = document.getElementById('save-settings');
const settingsBtn = document.getElementById('settings-btn');
const brandSelect = document.getElementById('brand-select');
const contentInput = document.getElementById('content-input');
const getSelectionBtn = document.getElementById('get-selection');
const checkBtn = document.getElementById('check-btn');
const resultDiv = document.getElementById('result');
const scoreCircle = document.getElementById('score-circle');
const scoreValue = document.getElementById('score-value');
const scoreLabel = document.getElementById('score-label');
const feedbackDiv = document.getElementById('feedback');
const revisedDiv = document.getElementById('revised');
const revisedText = document.getElementById('revised-text');
const copyRevisedBtn = document.getElementById('copy-revised');

let settings = {
  serverUrl: 'http://localhost:3000',
  apiKey: '',
  brands: [],
  currentBrand: null
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  if (settings.serverUrl && settings.apiKey) {
    showMainView();
    await loadBrands();
  } else {
    showSetupView();
  }
});

// Event Listeners
saveSettingsBtn.addEventListener('click', async () => {
  settings.serverUrl = serverUrlInput.value.trim().replace(/\/$/, '');
  settings.apiKey = apiKeyInput.value.trim();
  
  if (!settings.serverUrl || !settings.apiKey) {
    alert('Please enter both server URL and API key');
    return;
  }
  
  await saveSettings();
  showMainView();
  await loadBrands();
});

settingsBtn.addEventListener('click', () => {
  serverUrlInput.value = settings.serverUrl;
  apiKeyInput.value = settings.apiKey;
  showSetupView();
});

brandSelect.addEventListener('change', async () => {
  const brandId = brandSelect.value;
  settings.currentBrand = settings.brands.find(b => b.id === brandId) || null;
  await saveSettings();
});

getSelectionBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });
    
    if (result.result) {
      contentInput.value = result.result;
    }
  } catch (error) {
    console.error('Failed to get selection:', error);
  }
});

checkBtn.addEventListener('click', async () => {
  const content = contentInput.value.trim();
  
  if (!content) {
    alert('Please enter some content to check');
    return;
  }
  
  if (!settings.currentBrand) {
    alert('Please select a brand first');
    return;
  }
  
  checkBtn.disabled = true;
  checkBtn.textContent = 'Checking...';
  resultDiv.classList.remove('hidden');
  scoreValue.textContent = '...';
  scoreLabel.textContent = 'Analyzing...';
  feedbackDiv.innerHTML = '';
  revisedDiv.classList.add('hidden');
  
  try {
    const response = await fetch(`${settings.serverUrl}/api/webhook/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey
      },
      body: JSON.stringify({
        brandDNA: settings.currentBrand,
        content
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Check failed');
    }
    
    displayResult(data.result);
  } catch (error) {
    console.error('Check error:', error);
    scoreValue.textContent = '!';
    scoreLabel.textContent = 'Error';
    feedbackDiv.innerHTML = `<p style="color: #ff3b30;">${error.message}</p>`;
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check Content';
  }
});

copyRevisedBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(revisedText.textContent);
  copyRevisedBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyRevisedBtn.textContent = 'Copy';
  }, 2000);
});

// Functions
function showSetupView() {
  setupView.classList.remove('hidden');
  mainView.classList.add('hidden');
}

function showMainView() {
  setupView.classList.add('hidden');
  mainView.classList.remove('hidden');
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(['brandosSettings']);
  if (stored.brandosSettings) {
    settings = { ...settings, ...stored.brandosSettings };
    serverUrlInput.value = settings.serverUrl;
    apiKeyInput.value = settings.apiKey;
  }
}

async function saveSettings() {
  await chrome.storage.local.set({ brandosSettings: settings });
}

async function loadBrands() {
  // For now, we'll use brands stored in the extension
  // In production, you might fetch these from the server
  
  const stored = await chrome.storage.local.get(['brandosBrands']);
  if (stored.brandosBrands && stored.brandosBrands.length > 0) {
    settings.brands = stored.brandosBrands;
    populateBrandSelect();
    return;
  }
  
  // Show message to configure brands
  brandSelect.innerHTML = '<option value="">Import brands from brandos app</option>';
}

function populateBrandSelect() {
  brandSelect.innerHTML = '<option value="">Select a brand...</option>';
  
  settings.brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.id;
    option.textContent = brand.name;
    if (settings.currentBrand && settings.currentBrand.id === brand.id) {
      option.selected = true;
    }
    brandSelect.appendChild(option);
  });
}

function displayResult(result) {
  const score = result.score;
  
  // Animate score
  animateScore(score);
  
  // Set label
  if (score >= 90) scoreLabel.textContent = 'Excellent';
  else if (score >= 75) scoreLabel.textContent = 'Strong';
  else if (score >= 60) scoreLabel.textContent = 'Good';
  else if (score >= 40) scoreLabel.textContent = 'Fair';
  else scoreLabel.textContent = 'Needs Work';
  
  // Display feedback
  let feedbackHtml = '';
  
  if (result.strengths && result.strengths.length > 0) {
    feedbackHtml += '<p><strong>Strengths:</strong></p>';
    result.strengths.forEach(s => {
      feedbackHtml += `<p>✓ ${s}</p>`;
    });
  }
  
  if (result.issues && result.issues.length > 0) {
    feedbackHtml += '<p><strong>Issues:</strong></p>';
    result.issues.forEach(s => {
      feedbackHtml += `<p>✗ ${s}</p>`;
    });
  }
  
  feedbackDiv.innerHTML = feedbackHtml;
  
  // Show revised version
  if (result.revisedVersion) {
    revisedText.textContent = result.revisedVersion;
    revisedDiv.classList.remove('hidden');
  }
}

function animateScore(targetScore) {
  const circumference = 283; // 2 * PI * 45
  const offset = circumference - (targetScore / 100) * circumference;
  
  let current = 0;
  const duration = 800;
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    current = Math.round(targetScore * eased);
    scoreValue.textContent = current;
    
    const currentOffset = circumference - (current / 100) * circumference;
    scoreCircle.style.strokeDashoffset = currentOffset;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// Listen for messages from content script or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IMPORT_BRANDS') {
    settings.brands = message.brands;
    chrome.storage.local.set({ brandosBrands: message.brands });
    populateBrandSelect();
    sendResponse({ success: true });
  }
});

