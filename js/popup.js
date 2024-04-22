// Browser Polyfill
globalThis.browser ??= chrome;

let host = "",
  state = "",
  tabId = null;

// Event listener for the DOMContentLoaded event, which fires when the initial HTML document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", function (event) {
  setHost();
  initClickEvents();
  initMessagingEvents();
});

// Function to set up click event listeners
const initClickEvents = () => {
  document.addEventListener("click", eventListener);
};

// Listen for messages from the background script or other parts of the extension
const initMessagingEvents = () => {
  browser.runtime.onMessage.addListener(onMessage);
};

// Function to set the host variable based on the current active tab's URL
const setHost = () => {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const { url, id } = tabs[0];
    tabId = id;
    if (typeof url === "string") {
      host = url.indexOf("//") > -1 ? url.split("//")[1].split("/")[0] : "";
      browser.runtime.sendMessage({ name: "is_enable", host, tabId });
    }
  });
};

// Event listener for click events on the popup
const eventListener = (e) => {
  const { id } = e.target;
  if (id === "btn_hide") {
    browser.runtime.sendMessage({ name: "hide", host, tabId });
  } else if (id === "btn_show") {
    browser.runtime.sendMessage({ name: "show", host, tabId });
  } else if (id === "btn_disable") {
    browser.runtime.sendMessage({ name: "disable", host, tabId });
  } else if (id === "btn_enable") {
    browser.runtime.sendMessage({ name: "enable", host, tabId });
  } else if (id === "btn_close") {
    window.close();
  }
};

// Function to handle messages received from the background script or other parts of the extension
const onMessage = (msg) => {
  const { name } = msg;
  if (name === "close_window") {
    window.close();
  } else if (name === "host_enable") {
    document.getElementById("description").innerHTML =
      "<p>This extension is ENABLED<br>on <b>" + host + "</b</p>";
    document.getElementById("actions").innerHTML =
      '<button id="btn_disable" class="btn btn-green">DISABLE</button>' +
      '<button id="btn_hide" class="btn btn-green">HIDE COMMENTS ONE TIME</button>';
  } else if (name === "host_disable") {
    document.getElementById("description").innerHTML =
      "<p>This extension is DISABLED<br>on <b>" + host + "</b</p>";
    document.getElementById("actions").innerHTML =
      '<button id="btn_enable" class="btn btn-green">ENABLE</button>';
  } else if (name === "host_hidden") {
    document.getElementById("description").innerHTML =
      "<p>This extension is HIDDEN<br>On this page only" +
      '<p class="description">The host is ' + host + '</p>';
    document.getElementById("actions").innerHTML =
      '<button id="btn_show" class="btn btn-green">SHOW COMMENTS BACK</button>' +
      '<button id="btn_disable" class="btn btn-green">DISABLE THE HOST</button>';
  }
};
