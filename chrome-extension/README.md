# brandos Chrome Extension

Check content for brand consistency anywhere on the web.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this `chrome-extension` folder

## Setup

1. Click the brandos icon in your toolbar
2. Enter your brandos server URL (e.g., `http://localhost:3000`)
3. Enter your API key (set `BRANDOS_API_KEY` in your `.env.local`)
4. Save settings

## Usage

### From the Popup
1. Click the brandos icon
2. Select your brand from the dropdown
3. Type or paste content
4. Click "Check Content"

### Using Selected Text
1. Select text on any webpage
2. Click "Get Selected Text" in the popup
3. Click "Check Content"

### Context Menu
1. Select text on any webpage
2. Right-click
3. Choose "Check with brandos"

### Keyboard Shortcut
- `Alt + Shift + B` - Check selected text (opens popup)

## Importing Brands

To import your brands from the main brandos app:

1. Go to your brandos app
2. Open browser DevTools (F12)
3. Run in console:
```javascript
// Get brands from localStorage
const data = JSON.parse(localStorage.getItem('brandos-storage'));
const brands = data.state.brands;

// Send to extension
chrome.runtime.sendMessage(
  'YOUR_EXTENSION_ID', // Replace with your extension ID
  { type: 'IMPORT_BRANDS', brands },
  response => console.log('Imported:', response)
);
```

Or manually add brands in the extension's storage.

## Icons

Create icon files in the `icons/` folder:
- `icon16.png` (16x16)
- `icon32.png` (32x32)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use a simple "B" or your brandos logo.

## Development

The extension uses:
- `manifest.json` - Extension configuration
- `popup.html/css/js` - Popup UI
- `background.js` - Service worker for context menus
- `content.js/css` - Injected into web pages

## Notes

- Make sure your brandos server is running
- The extension needs the webhook API (`/api/webhook/check`) to be accessible
- CORS is handled by the webhook routes

