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

// Define popup display for each state.
const stateDisplay = {
  Enabled: () => {
    document.getElementById("description").innerHTML =
      "<p>This extension is ENABLED<br>on <b>" + host + "</b</p>";

    document.getElementById("actions").innerHTML =
      '<button id="trg_Disable" class="btn btn-green">DISABLE</button>' +
      '<button id="trg_Hide" class="btn btn-green">HIDE COMMENTS ONE TIME</button>';
  },

  Disabled: () => {
    document.getElementById("description").innerHTML =
      "<p>This extension is DISABLED<br>on <b>" + host + "</b</p>";

    document.getElementById("actions").innerHTML =
      '<button id="trg_Enable" class="btn btn-green">ENABLE</button>';
  },

  Hidden: () => {
    document.getElementById("description").innerHTML =
      "<p>This extension is HIDDEN<br>On this page only" +
      '<p class="description">The host is ' +
      host +
      "</p>";

    document.getElementById("actions").innerHTML =
      '<button id="trg_Show" class="btn btn-green">SHOW COMMENTS BACK</button>' +
      '<button id="trg_Disable" class="btn btn-green">DISABLE THE HOST</button>';
  },
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
