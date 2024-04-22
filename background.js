// For debug show message from page in the service worker console
// chrome.runtime.onMessage.addListener((message) => {
//   console.log("Message received:", message);
// });

// Browser Polyfill for chrome
globalThis.browser ??= chrome;

// Function to check if a given URL is valid
function isValidUrl(url) {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(
    url
  );
}

function initDisabledHostArray() {
  // Check if the disable_host array exists in local storage
  browser.storage.local.get("disabled_host", (result) => {
    if (result.disabled_host === undefined) {
      // If it doesn't exist, initialize it as an empty array
      browser.storage.local.set({
        disabled_host: ["pubpeer.com", "peeriodicals.com", "www.google.com"],
      });
    }
  });
}

// Call the function to initialize the disable_host array
initDisabledHostArray();

function addHostToDisabledArray(host) {
  return new Promise((resolve) => {
    // Retrieve the current disable_host array
    browser.storage.local.get("disabled_host", (result) => {
      let DisabledHostArray = result.disabled_host || [];
      // Add the new host to the array
      DisabledHostArray.push(host);
      // Save the updated array back to local storage
      browser.storage.local.set({ disabled_host: DisabledHostArray }, () => {
        resolve(); // Resolve the promise when the operation is complete
      });
    });
  });
}

function isHostInDisabledArray(host) {
  return new Promise((resolve) => {
    // Retrieve the current disabled_host array
    browser.storage.local.get("disabled_host", (result) => {
      let DisabledHostArray = result.disabled_host || [];
      // Check if the host is in the array
      resolve(DisabledHostArray.includes(host));
    });
  });
}

function removeHostFromDisabledArray(host) {
  return new Promise((resolve) => {
    // Retrieve the current disabled_host array
    browser.storage.local.get("disabled_host", (result) => {
      let DisabledHostArray = result.disabled_host || [];
      // Find the index of the host to remove
      const index = DisabledHostArray.indexOf(host);
      if (index !== -1) {
        // Remove the host from the array
        DisabledHostArray.splice(index, 1);
        // Save the updated array back to local storage
        browser.storage.local.set({ disabled_host: DisabledHostArray }, () => {
          resolve(); // Resolve the promise when the operation is complete
        });
      } else {
        resolve(); // Resolve the promise even if the host is not found
      }
    });
  });
}

function initHideHost() {
  // Check if the hide_host exists in local storage
  browser.storage.local.get("hide_host", (result) => {
    if (result.hide_host === undefined) {
      // If it doesn't exist, initialize it as false
      browser.storage.local.set({
        hide_host: false,
      });
    }
  });
}

// Call the function to initialize the hidden_host
initHideHost();

function setHideHost(value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ hide_host: value }, () => {
      resolve();
    });
  });
}

function getHideHost() {
  return new Promise((resolve) => {
    chrome.storage.local.get("hide_host", function (result) {
      const hideValue = result.hide_host === true;
      resolve(hideValue);
    });
  });
}

// Listener for messages from the background script or content scripts
const listener = async (msg) => {
  const { name, host, tabId } = msg;
  if (name === "hide") {
    // set hide true
    setHideHost(true);
    // remove comments
    runRemoveScript(tabId);
    browser.runtime.sendMessage({ name: "close_window" });
  } else if (name === "show") {
    // set hide false
    await setHideHost(false);
    // show comments
    showcomments(tabId);
    browser.runtime.sendMessage({ name: "close_window" });
  } else if (name === "disable") {
    // set hide false (to not clash with popup msg)
    setHideHost(false);
    // add to disabled host list
    addHostToDisabledArray(host);
    // remove comments
    runRemoveScript(tabId);
    browser.runtime.sendMessage({ name: "close_window" });
  } else if (name === "enable") {
    // remove host from disabled host list
    await removeHostFromDisabledArray(host);
    // show comments
    runDisplayScript(host, tabId);
    browser.runtime.sendMessage({ name: "close_window" });
  } else if (name === "is_enable") {
    // get boolean for host enable and hidden status
    let host_enabled = !(await isHostInDisabledArray(host));
    let host_hidden = await getHideHost();
    if (host_hidden) {
      browser.runtime.sendMessage({ name: "host_hidden" });
    } else if (host_enabled) {
      browser.runtime.sendMessage({ name: "host_enable" });
    } else {
      browser.runtime.sendMessage({ name: "host_disable" });
    }
  }
};

// Function to display content with a delay of 300 ms
const showcomments = async (tabId) => {
  setTimeout(async () => {
    await browser.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/contentScript/content.js"],
    });
  }, 300);
  await setHideHost(false);
};
// Function to execute scripts for displaying content
const runDisplayScript = async (host, tabId) => {
  const scriptsToExecute = [
    { file: "js/contentScript/utils.js", target: { tabId: tabId } },
    { file: "js/contentScript/sanitizer.js", target: { tabId: tabId } },
    { file: "js/contentScript/domains.js", target: { tabId: tabId } },
    { file: "js/contentScript/browser.js", target: { tabId: tabId } },
    { file: "js/contentScript/element.js", target: { tabId: tabId } },
    { file: "js/contentScript/pubpeer.js", target: { tabId: tabId } },
  ];
  let host_enable = !(await isHostInDisabledArray(host));
  if (host_enable) {
    for (const script of scriptsToExecute) {
      await browser.scripting.executeScript({
        target: script.target,
        files: [script.file],
      });
    }
    // Then show comments
    showcomments(tabId);
  }
};

// Function to execute script for removing content
const runRemoveScript = (tabId) => {
  browser.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/contentScript/removePubPeerMarks.js"],
  });
};

// Initialize event listener for web navigation
const initTabsEvent = () => {
  browser.webNavigation.onCompleted.addListener((details) => {
    const { tabId, url } = details;
    if (isValidUrl(url)) {
      const host =
        url.indexOf("//") > -1 ? url.split("//")[1].split("/")[0] : "";
      runDisplayScript(host, tabId);
    }
  });
};

// Initialize the service worker
const init = () => {
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();
