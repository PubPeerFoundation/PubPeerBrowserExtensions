(function (Browser) {
  "use strict";
  const pubpeer = new PubPeer(Browser);
  pubpeer.init();
})(Browser);

// for debug
// console.log('content loaded');
// chrome.runtime.sendMessage({ name: 'content loaded'});
