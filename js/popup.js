
let host = '', tabId = null;

// Event listener for the DOMContentLoaded event, which fires when the initial HTML document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", function (event) {
 setHost();
 initClickEvents();
 initMessagingEvents();
});

// Function to set up click event listeners
const initClickEvents = () => {
 document.addEventListener('click', eventListener);
};

 // Listen for messages from the background script or other parts of the extension
const initMessagingEvents = () => {
 chrome.runtime.onMessage.addListener(onMessage);
};

// Function to set the host variable based on the current active tab's URL
const setHost = () => {
 chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const { url, id } = tabs[0];
    tabId = id;
    if (typeof url === 'string') {
      host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
      document.getElementById('host').innerText = host;
    }
 });
};

// Event listener for click events on the popup
const eventListener = (e) => {
 const { id } = e.target;
 if (id === 'btn_disable_once') {
    chrome.runtime.sendMessage({ name: 'disableOnce', host, tabId });
 } else if (id === 'btn_disable_forever') {
    chrome.runtime.sendMessage({ name: 'disableForever', host, tabId });
 } else if (id === 'btn_enable') {
    chrome.runtime.sendMessage({ name: 'enable', host, tabId })
 }
};

// Function to handle messages received from the background script or other parts of the extension
const onMessage = (msg) => {
 console.log(`Received message: ${JSON.stringify(msg)}`);
 const { name } = msg;
 if (name === 'close_window') {
    // Close the popup window
    window.close();
 }
};