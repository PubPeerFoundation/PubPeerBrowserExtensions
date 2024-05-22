const initDisabledHost = () => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    if (result.DISABLED_HOSTS === undefined) {
      browser.storage.local.set({
        DISABLED_HOSTS: ["pubpeer.com", "peeriodicals.com", "www.google.com"],
      });
    }
  });
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

// Listener for transision triggers from popup
const listener = async (msg) => {
  const { object, content, host, tabId } = msg;
  if (object === "transition") {
    transitionActions[content](host, tabId);
    let State = await getState(host, tabId);
    let nextState = transitions[content][State];
    storeState(nextState, host, tabId);
  }
};

const init = () => {
  // reseting the states on every new sessions.
  browser.storage.local.set({ STATES: JSON.stringify({}) });
  initDisabledHost();
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();
