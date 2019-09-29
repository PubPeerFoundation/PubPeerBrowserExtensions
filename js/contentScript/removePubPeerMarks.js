(function() {
	'use strict';
	var PPElements = document.querySelectorAll('p.pp_comm');
	if (PPElements.length) {
		PPElements.forEach(element => {
			if (element && element.remove && typeof element.remove === 'function') {
				element.remove();
			}
		})
	}
}());
