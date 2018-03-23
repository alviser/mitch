'use strict';
/*
	helper functions implementing communication with the
	background page, changing an already logged request status
*/

function changeFlag(e,w) {
	var rcrd = e.currentTarget.parentElement.parentElement;
	var id = rcrd.getAttribute('goldset_id');

	browser.runtime.getBackgroundPage().then( function (bp) {
		console.log("flag changed from " + bp.goldset[id].flag);
		bp.goldset[id].flag = w;
		console.log("flag changed to " + bp.goldset[id].flag);
		if (w == 'n') {
			rcrd.className = "nonsensitive";
			bp.goldset[id].req.response = "";
		} else if (w == 'y') {
			rcrd.className = "sensitive";
		} else if (w == 'm') {
			rcrd.className = "maybesensitive";
		} else {
			rcrd.className = "unflagged";
		}
	});
}

function comment(e) {
	console.log(e);
	var rcrd = e.target.parentElement.parentElement;
	var id = rcrd.getAttribute('goldset_id');

	browser.runtime.getBackgroundPage().then( function (bp) {
		bp.goldset[id].comment = e.target.value;
	});
}

function cleanup(e) {
	console.log("cleaning up");
	browser.runtime.getBackgroundPage().then( function (bp) {
		bp.goldset.splice(0,bp.goldset.length);
		bp.worklist.splice(0,bp.worklist.length);
	});

	window.close();
}

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var json = JSON.stringify(data),
            blob = new Blob([json], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

// getting the background page to access the data array
browser.runtime.getBackgroundPage().then( function (bkg) {
	bkg.flush();

	var xprt = document.getElementById('export_json');
	xprt.addEventListener('click', function(e) { saveData(bkg.goldset,"data.json");});

	document.getElementById('counter').innerHTML = bkg.goldset.length;

	bkg.goldset.forEach(function (r,i) {   
		var reqElement 	= document.createElement("li");
		reqElement.setAttribute('goldset_id',i);
		if (r.flag == 'n') {
			reqElement.className = "nonsensitive";
		} else if (r.flag == 'y') {
			reqElement.className = "sensitive";
		} else if (r.flag == 'm') {
			reqElement.className = "maybesensitive";
		} else {
			reqElement.className = "unflagged";
		}

		var actions 	= document.createElement("div");		// container for sensitive/nonsensitive buttons
		actions.className = "actions";

		var clean = document.getElementById('cleanup');
		clean.addEventListener('click',cleanup);

		var markS	= document.createElement("span");		// sensitive button
		markS.appendChild(document.createTextNode("Y"));
		markS.className = "sensitive";
		markS.addEventListener("click",function (e) { changeFlag(e,'y'); });

		var markMS	= document.createElement("span");		// nonsensitive button
		markMS.appendChild(document.createTextNode("M"));
		markMS.className ="maybesensitive";
		markMS.addEventListener("click",function (e) { changeFlag(e,'m'); });

		var markNS	= document.createElement("span");		// nonsensitive button
		markNS.appendChild(document.createTextNode("N"));
		markNS.className ="nonsensitive";
		markNS.addEventListener("click",function (e) { changeFlag(e,'n'); });

		var cmnt	= document.createElement("input");		// nonsensitive button
		cmnt.className ="makeacomment";
		cmnt.value = r.comment;
		cmnt.addEventListener("change",comment);

		actions.appendChild(cmnt);
		actions.appendChild(markS);
		actions.appendChild(markMS);
		actions.appendChild(markNS);

		var reqData = document.createTextNode(" " + r.req.method + " " + r.req.url);
		var reqParams = document.createTextNode("\t\t\t\t\t" + JSON.stringify(r.req.params));

		reqElement.appendChild(actions);
		reqElement.appendChild(reqData);
		reqElement.appendChild(document.createElement("br"));
		reqElement.appendChild(reqParams);

		document.getElementById("rlist").appendChild(reqElement);
	});
});