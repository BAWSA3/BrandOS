'use strict';
var out = document.getElementById('out');
var inn = document.getElementById('in');

function render(status) {
  out.hidden = status.connected;
  inn.hidden = !status.connected;
  if (status.connected) document.getElementById('handle').textContent = status.handle ? '@' + status.handle : 'your account';
}

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, render);
chrome.storage.sync.get({ autoScore: true }, function (v) {
  document.getElementById('auto').checked = v.autoScore !== false;
});
document.getElementById('auto').addEventListener('change', function (e) {
  chrome.storage.sync.set({ autoScore: e.target.checked });
});
document.getElementById('connect').addEventListener('click', function () {
  chrome.tabs.create({ url: 'https://mybrandos.app/extension-auth' });
});
document.getElementById('signout').addEventListener('click', function () {
  chrome.runtime.sendMessage({ type: 'SIGN_OUT' }, function () {
    render({ connected: false });
  });
});
