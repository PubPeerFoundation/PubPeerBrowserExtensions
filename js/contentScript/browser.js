var Browser = (function () {
  'use strict';

  if (typeof navigator === 'undefined' || !navigator) {
    return null;
  }

  var userAgentString = navigator.userAgent;

  var browsers = [
    ['Edge', /Edge\/([0-9\._]+)/],
    ['Chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
    ['Firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
    ['Safari', /Version\/([0-9\._]+).*Safari/]
  ];

  return browsers.map(function (rule) {
    if (rule[1].test(userAgentString)) {
      var match = rule[1].exec(userAgentString);
      var version = match && match[1].split(/[._]/).slice(0, 3);

      if (version && version.length < 3) {
        Array.prototype.push.apply(version, (version.length == 1) ? [0, 0] : [0]);
      }

      return {
        name: rule[0],
        version: version.join('.')
      };
    }
  }).filter(Boolean).shift();
})();
