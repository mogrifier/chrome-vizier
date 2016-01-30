chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
	'id': 'vizierizdepski',
    'outerBounds': {
      'width': 1000,
      'height': 800
    }
  });
});

chrome.runtime.onSuspend.addListener(function() {
	  // Do some simple clean-up tasks.
	});