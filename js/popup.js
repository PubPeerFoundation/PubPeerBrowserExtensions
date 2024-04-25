// Browser Polyfill
globalThis.browser ??= chrome;

let host = "",
  tabId = null,
  State = "";

// Event listener for the DOMContentLoaded event, which fires when the initial HTML document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", function (event) {
  setHost();
  initClickEvents();
});

// Function to set up click event listeners
const initClickEvents = () => {
  document.addEventListener("click", eventListener);
};

// Function to set the host variable based on the current active tab's URL
const setHost = () => {
  browser.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const { url, id } = tabs[0];
    tabId = id;
    if (typeof url === "string") {
      host = url.indexOf("//") > -1 ? url.split("//")[1].split("/")[0] : "";
      State = await getState(host, tabId);
      stateDisplay[State]();
    }
  });
};

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

const getState = (host, tabId) => {
  return new Promise(async (resolve) => {
    let { key, stateStorage } = await keyAndStateStorage(host, tabId);
    resolve(stateStorage[key] || null);
  });
};

// Define actions for each transition
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

// Event listener for click events on the popup
const eventListener = (e) => {
  const { id } = e.target;
  if (id.slice(0, 3) === "trg") {
    browser.runtime.sendMessage({
      object: "transition",
      content: id.slice(4),
      host,
      tabId,
    });
    window.close();
  } else if (id === "close") {
    window.close();
  }
};
