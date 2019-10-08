(function() {
  'use strict';
  removeElements(['div.pp_comm', 'p.pp_articles']);

  function removeElements (selectors) {
    if (selectors.length) {
      selectors.forEach(selector => {
        removeElementsBySelector(selector);
      });
    }
  }

  function removeElementsBySelector (selector) {
    var PPElements = document.querySelectorAll(selector);
    if (PPElements.length) {
      PPElements.forEach(element => {
        if (element && element.remove && typeof element.remove === 'function') {
          element.remove();
        }
      })
    }
  }
}());
