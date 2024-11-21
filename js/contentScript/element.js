Element.prototype.parents = function (selector) {
  "use strict";
  var parents = [],
    element = this,
    hasSelector = selector !== undefined;

  while ((element = element.parentElement)) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    if (!hasSelector || element.matches(selector)) {
      parents.push(element);
    }
  }

  return parents;
};
// unknown bug in firefox : need this line to work.
console.log("");
