
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkClass') {
      console.log("checking pubpeer class");
      const classExists = !(typeof PubPeer === 'undefined');
      // Send back the boolean value indicating whether the class exists
      // console.log(classExists);
      sendResponse(classExists);
    }
   });

  //  console.log("Check Pubpeer in loaded");