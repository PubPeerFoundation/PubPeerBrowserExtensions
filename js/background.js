// Browser Polyfill for chrome
globalThis.browser ??= chrome;

// Function to check if a given URL is valid
const isValidUrl = (url) => {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(
    url
  );
};

//  Functions for storing/retreiving disabled hosts in the local storage.
const initDisabledHostArray = () => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    if (result.DISABLED_HOSTS === undefined) {
      browser.storage.local.set({
        DISABLED_HOSTS: ["pubpeer.com", "peeriodicals.com", "www.google.com"],
      });
    }
  });
};

const addHostToDisabledArray = (host) => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    let DisabledHostArray = result.DISABLED_HOSTS || [];
    DisabledHostArray.push(host);
    browser.storage.local.set({ DISABLED_HOSTS: DisabledHostArray });
  });
};

const isHostInDisabledArray = (host) => {
  return new Promise((resolve) => {
    browser.storage.local.get("DISABLED_HOSTS", (result) => {
      let DisabledHostArray = result.DISABLED_HOSTS || [];
      resolve(DisabledHostArray.includes(host));
    });
  });
};

const removeHostFromDisabledArray = (host) => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    let DisabledHostArray = result.DISABLED_HOSTS || [];
    const index = DisabledHostArray.indexOf(host);
    if (index !== -1) {
      DisabledHostArray.splice(index, 1);
      browser.storage.local.set({ DISABLED_HOSTS: DisabledHostArray });
    }
  });
};

//  Functions for storing/retreiving the state of the extension
//  for each tab during a session.
const keyAndStateStorage = async (host, tabId) => {
  return new Promise((resolve) => {
    let key = `${host}:${tabId}`;
    browser.storage.local.get("STATES", (result) => {
      let stateStorage = result.STATES;
      stateStorage = JSON.parse(stateStorage) || {};
      resolve({ key, stateStorage });
    });
  });
};

const storeState = async (state, host, tabId) => {
  let { key, stateStorage } = await keyAndStateStorage(host, tabId);
  stateStorage[key] = state;
  browser.storage.local.set({ STATES: JSON.stringify(stateStorage) });
};

const getState = (host, tabId) => {
  return new Promise(async (resolve) => {
    let { key, stateStorage } = await keyAndStateStorage(host, tabId);
    resolve(stateStorage[key] || null);
  });
};

// Function to execute scripts for displaying content
const runDisplayScript = async (tabId) => {
  const scriptsToExecute = [
    { file: "js/contentScript/utils.js", target: { tabId: tabId } },
    { file: "js/contentScript/sanitizer.js", target: { tabId: tabId } },
    { file: "js/contentScript/domains.js", target: { tabId: tabId } },
    { file: "js/contentScript/browser.js", target: { tabId: tabId } },
    { file: "js/contentScript/element.js", target: { tabId: tabId } },
    { file: "js/contentScript/pubpeer.js", target: { tabId: tabId } },
  ];
  for (const script of scriptsToExecute) {
    await browser.scripting.executeScript({
      target: script.target,
      files: [script.file],
    });
  }
  // Then show comments with a delay of 300 ms
  setTimeout(() => {
    showContent(tabId);
  }, 300);
};

// Function to display content
const showContent = (tabId) => {
  browser.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/contentScript/content.js"],
  });
};

// Function to execute script for removing content
const hideContent = (tabId) => {
  browser.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/contentScript/removePubPeerMarks.js"],
  });
};

// Define the State machine to handle extension actions.
const states = {
  ENABLED: "Enabled",
  DISABLED: "Disabled",
  HIDDEN: "Hidden",
};

const transitions = {
  Enable: {
    [states.DISABLED]: states.ENABLED,
  },
  Disable: {
    [states.ENABLED]: states.DISABLED,
    [states.HIDDEN]: states.DISABLED,
  },
  Hide: {
    [states.ENABLED]: states.HIDDEN,
  },
  Show: {
    [states.HIDDEN]: states.ENABLED,
  },
};

// Define actions for each transition
const transitionActions = {
  Enable: (host, tabId) => {
    removeHostFromDisabledArray(host);
    runDisplayScript(tabId);
  },
  Disable: (host, tabId) => {
    addHostToDisabledArray(host);
    hideContent(tabId);
  },
  Hide: (host, tabId) => {
    hideContent(tabId);
  },
  Show: (host, tabId) => {
    showContent(tabId);
  },
};

// Listener for messages from popup
const listener = async (msg) => {
  const { object, content, host, tabId } = msg;
  if (object === "transition") {
    transitionActions[content](host, tabId);
    let State = await getState(host, tabId);
    let nextState = transitions[content][State];
    storeState(nextState, host, tabId);
  }
};

const initState = async (host, tabId) => {
  let enabled_host = !(await isHostInDisabledArray(host));
  if (enabled_host) {
    storeState("Enabled", host, tabId);
    runDisplayScript(tabId);
  } else {
    storeState("Disabled", host, tabId);
  }
};

// Listener for new tab (get host/tabId and initiate state)
const initTabsEvent = () => {
  browser.webNavigation.onCompleted.addListener((details) => {
    const { tabId, url } = details;
    if (isValidUrl(url) & (details.frameId === 0)) {
      const host =
        url.indexOf("//") > -1 ? url.split("//")[1].split("/")[0] : "";
      initState(host, tabId);
    }
  });
};

const init = () => {
  browser.storage.local.set({ STATES: JSON.stringify({}) });
  initDisabledHostArray();
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();
