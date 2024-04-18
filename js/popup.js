// Browser Polyfill
globalThis.browser ??= chrome;

let host = '', state = '', tabId = null;

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
 browser.runtime.onMessage.addListener(onMessage);
};

// Function to set the host variable based on the current active tab's URL
const setHost = () => {
 browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    const { url, id } = tabs[0];
    tabId = id;
    if (typeof url === 'string') {
      host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
      document.getElementById('host').innerText = host;
      browser.runtime.sendMessage({ name: 'is_enable', host, tabId });
    }
 });
};

// Event listener for click events on the popup
const eventListener = (e) => {
 const { id } = e.target;
 if (id === 'btn_hide') {
      browser.runtime.sendMessage({ name: 'hide', host, tabId });
 } else if (id === 'btn_disable') {
      browser.runtime.sendMessage({ name: 'disable', host, tabId });
 } else if (id === 'btn_enable') {
      browser.runtime.sendMessage({ name: 'enable', host, tabId })
 } else if (id === 'btn_close') {
      window.close();
}
};

// Function to handle messages received from the background script or other parts of the extension
const onMessage = (msg) => {
//  console.log(`Received message: ${JSON.stringify(msg)}`);
 const { name } = msg;
 if (name === 'close_window') {
    // Close the popup window
    window.close();
 } else if (name === "host_enable") {
    document.getElementById('state').innerText = 'ENABLED'
    document.getElementById('actions').innerHTML = 
    '<button id="btn_disable" class="btn btn-green">DISABLE COMMENTS</button>'+
    '<button id="btn_hide" class="btn btn-green">HIDE COMMENTS (ephemeral)</button>'
 } else if (name === "host_disable") {
    document.getElementById('state').innerText = 'DISABLED'
    document.getElementById('actions').innerHTML = 
    '<button id="btn_enable" class="btn btn-green">ENABLE COMMENTS</button>'
}
};

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
