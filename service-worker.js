// For debug show message from page in the service worker console
// chrome.runtime.onMessage.addListener((message) => {
//   console.log("Message received:", message);
// });

// Utility functions

// Function to make an array unique
function unique(array) {
  return [... new Set(array)];
 }
 
 // Function to check if a given URL is valid
 function isValidUrl(url) {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(url);
 }
 
 // Temporary array to hold hosts that are disabled for the current session
 let tempDisabledHosts = [];
 
 // Array of hosts that are permanently forbidden
 const forbiddenHosts = [
  'chrome.google.com',
  'addons.mozilla.org',
  'peeriodicals.com'
 ];
 
 // Key used to store disabled hosts in Chrome's local storage
 const STORAGE_KEY = 'DISABLED_HOSTS';
 
 // Listener for messages from the background script or content scripts
 const listener = async (msg, sender) => {
  const { name, host, tabId } = msg;
  chrome.storage.local.get(STORAGE_KEY, ({ [STORAGE_KEY]: disabledHosts }) => {
     disabledHosts = disabledHosts || [];
     if (name === 'disableOnce') {
       // Temporarily disable the host for the current session
       tempDisabledHosts = addItem(host, tempDisabledHosts);
       // Remove the host from the permanent list
       chrome.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) }, () => {
         chrome.runtime.sendMessage({ name: 'close_window' });
         runRemoveScript(tabId);
       });
     } else if (name === 'disableForever') {
       // Permanently disable the host
       chrome.storage.local.set({ [STORAGE_KEY]: addItem(host, disabledHosts) }, () => {
         tempDisabledHosts = removeItem(host, tempDisabledHosts);
         chrome.runtime.sendMessage({ name: 'close_window' });
         runRemoveScript(tabId);
       });
     } else if (name === 'enable') {
       // Enable the host
       chrome.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) }, () => {
         tempDisabledHosts = removeItem(host, tempDisabledHosts);
         chrome.runtime.sendMessage({ name: 'close_window' });
         runDisplayScript(host, tabId);
       });
     }
  });
 }
 
 // Function to remove an item from an array
 const removeItem = (item, arr) => {
  if (Array.isArray(arr)) {
     return unique(arr.filter(value => item !== value));
  }
  return [];
 }
 
 // Function to add an item to an array
 const addItem = (item, arr) => {
  if (Array.isArray(arr)) {
     arr.push(item);
     return unique(arr);
  }
  return [];
 };
 
// Function to check if a class exists in a tab
const PubpeerExists = async (tabId) => {
  return new Promise((resolve) => {
     chrome.tabs.sendMessage(tabId, { action: 'checkClass' }, (response) => {
       resolve(response);
     });
  });
 };


 // Function to execute scripts for displaying content
 const runDisplayScript = async (host, tabId) => {
  let { [STORAGE_KEY]: disabledHosts } = await chrome.storage.local.get(STORAGE_KEY);
  disabledHosts = disabledHosts || [];
  if (!forbiddenHosts.includes(host) && !disabledHosts.includes(host) && !tempDisabledHosts.includes(host)) {
    const scriptsToExecute = [
      { file: 'js/utils.js', target: { tabId: tabId } },
      { file: 'js/contentScript/sanitizer.js', target: { tabId: tabId } },
      { file: 'js/contentScript/domains.js', target: { tabId: tabId } },
      { file: 'js/contentScript/browser.js', target: { tabId: tabId } },
      { file: 'js/contentScript/element.js', target: { tabId: tabId } },
      { file: 'js/contentScript/pubpeer.js', target: { tabId: tabId } }
    ];
    // check if Pubpeer Class already exists in the page (avoid annoying error message)
    // const exist = await PubpeerExists(tabId)
    if (await PubpeerExists(tabId)){
      // Execute the content script alone
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['js/contentScript/content.js']
      });
    }
    else {
      // Execute all necessary scripts 
      for (const script of scriptsToExecute) {
        await chrome.scripting.executeScript({
          target: script.target,
          files: [script.file]
        });
      }
      // Then Execute the content script with a delay of 300 ms
      setTimeout(async () => {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['js/contentScript/content.js']
        });
      }, 300)
    }
  }
 }
 
 // Function to execute script for removing content
 const runRemoveScript = (tabId) => {
  chrome.scripting.executeScript({
     target: { tabId: tabId },
     files: ['js/contentScript/removePubPeerMarks.js']
  });
 }
 
 // Initialize event listener for web navigation
 const initTabsEvent = () => {
  chrome.webNavigation.onCompleted.addListener((details) => {
     const { tabId, url } = details;
     if (isValidUrl(url)) {
       const host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
       runDisplayScript(host, tabId);
     }
  });
 }
 
 // Initialize the service worker
 const init = () => {
  chrome.runtime.onMessage.addListener(listener);
  initTabsEvent();
 };
 
 init();