'use strict';

function finished_Alice1(e,w) {
	browser.runtime.getBackgroundPage().then( function (bp) {
		bp.finished_Alice1();
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Alice1(); })
	});
	
}

function logged_out_Alice1(e,w) {
	browser.runtime.getBackgroundPage().then( function (bp) {
		bp.logged_out_Alice1();
		document.getElementById('message').innerHTML = "please login as a different user and press the button";
		document.getElementById('main_button').value = "I logged in, continue...";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { logged_in_Bob(); });
	});
}

function logged_in_Bob() {
   	browser.runtime.getBackgroundPage().then( function (bp) {
		bp.logged_in_Bob();
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Bob(); });
	});
}

function logged_out_Bob() {
   browser.runtime.getBackgroundPage().then( function (bp) {
		bp.logged_out_Bob();
		document.getElementById('message').innerHTML = "please login again as the first user and press the button";
		document.getElementById('main_button').value = "I logged in, continue...";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { logged_in_Alice2(); });
	});
}

function logged_in_Alice2() {
   browser.runtime.getBackgroundPage().then( function (bp) {
		bp.logged_in_Alice2();
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Alice2(); });
	});
}

function logged_out_Alice2() {
    browser.runtime.getBackgroundPage().then( function (bp) {
		bp.logged_out_Alice2();
		document.getElementById('message').innerHTML = "ok, all should have been done";
		document.getElementById('main_button').value = "draw conclusions";
		document.getElementById('main_button').removeEventListener('click');
		document.getElementById('main_button').addEventListener('click', function (e) { make_conclusions(); });
	});
}

function make_conclusions() {
    browser.runtime.getBackgroundPage().then( function (bp) {
		bp.make_conclusions();
		window.close();
	});
}

// getting the background page to access the data array
browser.runtime.getBackgroundPage().then( function (bkg) {


	if (bkg.phase == 0) {
		document.getElementById('sensitive_requests').innerHTML = bkg.collected_sensitive_requests;
		document.getElementById('total_requests').innerHTML = bkg.collected_total_request;
		document.getElementById('main_button').addEventListener('click', function (e) { finished_Alice1(); })
	} else if (bkg.phase == 1) {
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Alice1(); })
	} else if (bkg.phase == 2) {
		document.getElementById('message').innerHTML = "please login as a different user and press the button";
		document.getElementById('main_button').value = "I logged in, continue...";
		document.getElementById('main_button').addEventListener('click', function (e) { logged_in_Bob(); });
	} else if (bkg.phase == 3) {
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Bob(); });
	} else if (bkg.phase == 4) {
		document.getElementById('message').innerHTML = "please login again as the first user and press the button";
		document.getElementById('main_button').value = "I logged in, continue...";
		document.getElementById('main_button').addEventListener('click', function (e) { logged_in_Alice2(); });
	} else if (bkg.phase == 5) {
		document.getElementById('message').innerHTML = "please logout from the current session and press the button";
		document.getElementById('main_button').value = "I logged out, continue...";
		document.getElementById('main_button').addEventListener('click', function (e) { logged_out_Alice2(); });
	} else if (bkg.phase == 6) {
		document.getElementById('message').innerHTML = "ok, all should have been done";
		document.getElementById('main_button').value = "draw conclusions";
		document.getElementById('main_button').addEventListener('click', function (e) { make_conclusions(); });
	} else {
		document.getElementById('message').innerHTML = "thank you for playing";
		document.getElementById('main_button').remove();
	}
	
});