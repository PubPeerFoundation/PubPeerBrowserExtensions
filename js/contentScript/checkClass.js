
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkClass') {
      const classExists = !(typeof PubPeer === 'undefined')
      // Send back the boolean value indicating whether the class exists
      // console.log(classExists);
      sendResponse(classExists);
    }
   });
