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
