// For debug show message from page in the service worker console
// chrome.runtime.onMessage.addListener((message) => {
//   console.log("Message received:", message);
// });

// Browser Polyfill for chrome
globalThis.browser ??= chrome;

// Function to check if a given URL is valid
function isValidUrl(url) {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(url);
}

function initEnabledHostArray() {
  // Check if the disable_host array exists in local storage
  browser.storage.local.get('enabled_host', (result) => {
     if (result.enabled_host === undefined) {
       // If it doesn't exist, initialize it as an empty array
       browser.storage.local.set({ enabled_host: ['pubmed.ncbi.nlm.nih.gov','scholar.google.com'] });
     }
  });
}
 
// Call the function to initialize the disable_host array
initEnabledHostArray();

function addHostToEnabledArray(host) {
  return new Promise((resolve) => {
      // Retrieve the current disable_host array
      browser.storage.local.get('enabled_host', (result) => {
        let EnabledHostArray = result.enabled_host || [];
        // Add the new host to the array
        EnabledHostArray.push(host);
        // Save the updated array back to local storage
        browser.storage.local.set({ enabled_host: EnabledHostArray }, () => {
          resolve(); // Resolve the promise when the operation is complete
        });
      });
  });
}

function isHostInEnabledArray(host) {
  return new Promise((resolve) => {
      // Retrieve the current enabled_host array
      browser.storage.local.get('enabled_host', (result) => {
        let EnabledHostArray = result.enabled_host || [];
        // Check if the host is in the array
        resolve(EnabledHostArray.includes(host));
      });
  });
}

function removeHostFromEnabledArray(host) {
  return new Promise((resolve) => {
     // Retrieve the current enabled_host array
     browser.storage.local.get('enabled_host', (result) => {
       let EnabledHostArray = result.enabled_host || [];
       // Find the index of the host to remove
       const index = EnabledHostArray.indexOf(host);
       if (index !== -1) {
         // Remove the host from the array
         EnabledHostArray.splice(index, 1);
         // Save the updated array back to local storage
         browser.storage.local.set({ enabled_host: EnabledHostArray }, () => {
           resolve(); // Resolve the promise when the operation is complete
         });
       } else {
         resolve(); // Resolve the promise even if the host is not found
       }
     });
  });
}


// Listener for messages from the background script or content scripts
const listener = async (msg) => {
  const { name, host, tabId } = msg;
    if (name === 'hide') {
    browser.runtime.sendMessage({ name: 'close_window' });
    runRemoveScript(tabId);
  } 
  else if (name === 'disable') {
    await removeHostFromEnabledArray(host)
    browser.runtime.sendMessage({ name: 'close_window' });
    runRemoveScript(tabId);
  } 
  else if (name === 'enable') {
    let alreadyenabled = await isHostInEnabledArray(host)
    if (!alreadyenabled){
      await addHostToEnabledArray(host)
    }
    browser.runtime.sendMessage({ name: 'close_window' });
    runDisplayScript(host, tabId);
  }
}

// Function to execute scripts for displaying content
const runDisplayScript = async (host, tabId) => {
  const scriptsToExecute = [
    { file: 'js/contentScript/utils.js', target: { tabId: tabId } },
    { file: 'js/contentScript/sanitizer.js', target: { tabId: tabId } },
    { file: 'js/contentScript/domains.js', target: { tabId: tabId } },
    { file: 'js/contentScript/browser.js', target: { tabId: tabId } },
    { file: 'js/contentScript/element.js', target: { tabId: tabId } },
    { file: 'js/contentScript/pubpeer.js', target: { tabId: tabId } }
  ];
  let show = await isHostInEnabledArray(host)
  if (show) {
    for (const script of scriptsToExecute) {
      await browser.scripting.executeScript({
        target: script.target,
        files: [script.file]
      });
    }
    // Then Execute the content script with a delay of 300 ms
    setTimeout(async () => {
      await browser.scripting.executeScript({
        target: { tabId: tabId },
        files: ['js/contentScript/content.js']
      });
    }, 300)
  }
}

// Function to execute script for removing content
const runRemoveScript = (tabId) => {
  browser.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/contentScript/removePubPeerMarks.js']
  });
}

// Initialize event listener for web navigation
const initTabsEvent = () => {
  browser.webNavigation.onCompleted.addListener((details) => {
      const { tabId, url } = details;
      if (isValidUrl(url)) {
        const host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
        runDisplayScript(host, tabId);
      }
  });
}

// Initialize the service worker
const init = () => {
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();