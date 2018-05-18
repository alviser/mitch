'use strict';

// var worklist  = [];    // yet unlabelled requests
// var goldset   = [];    // already labelled requests

var visitingURLObj;

var phase                        = 0;        // see from line 211 for the various phases
var sensitive_requests           = [];       // this will be alice's first run
var collected_sensitive_requests = 0;
var collected_total_request      = 0;
var bob_requests                 = [];
var alice1_requests              = [];
var unauth_requests              = [];
var null_collector               = [];       // FIXME: just a sink
var candidates                   = [];       // final CSRFs candidates

var active_collector;
active_collector = sensitive_requests;

var classifier = new RandomForestClassifier();


// Extracts the parameters from a query string (for GET requests)
function parseParams (p) {
   var res = {};
   for (var k of p.keys())
      res[k] = p.getAll(k);
   return res;
}

// Ignores some requests which are certainly not HTTP and requests to third-parties
function goodUrl (u,s) {
   var isGood = true;

   if (!u.protocol.startsWith('http'))
      isGood = false;

   if (u.pathname.endsWith('/chrome/newtab'))
      isGood = false;

   var tokens = s.hostname.split('.');
   var domain = tokens[tokens.length-2];

   if (!u.host.includes(domain))
      isGood = false;

   return isGood;
}

// Checks the number and the names of all the parameters of HTTP requests a,b
function sameParams (a,b) {
   var flag = true;
   var keysA = Object.keys(a);
   var keysB = Object.keys(b);

   if (keysA.length != keysB.length)
      flag = false;
   else {
      keysA.forEach (function (k) {
         if (!keysB.includes(k))
            flag = false;
      });
   }

   return flag;
}

function compareReq(a,b) {
   return a.method == b.method && a.url == b.url && sameParams(a.params,b.params);
}

// Checks whether the request r is already in gs (up to sameParams)
function isKnown (r,gs) {
   var flag = false;

   gs.forEach (function (g) {
      // console.log("COMPARING");
      // console.log(g);
      // console.log(r);
      if (compareReq(g,r))
         flag = true;
   });

   // console.log("COMPARISON RESULTED IN: " + flag);
   return flag;
}

// Builds a list of sensitive HTTP requests
chrome.webRequest.onBeforeRequest.addListener (function (details) {
   var urlObj = new URL(details.url);
   if (details.type == "main_frame") {
      visitingURLObj = new URL(details.url);
   }

   if (goodUrl(urlObj, visitingURLObj)) {

      var method = details.method;   
      
      var urlClean = urlObj.protocol + "//" + urlObj.hostname + urlObj.pathname;
      var req = {'method': method, 'url': urlClean, 'params': {}, 'reqId': details.requestId, 'response' : {}};
      // console.log('reasoning on: ' + req['url']);
      req['response']['body'] = "";

      var filter = browser.webRequest.filterResponseData(details.requestId);

      var decoder = new TextDecoder();

      filter.onstart = event => {
         // console.log("starting " + req['url'] + " [ " + filter.status + " ] ");
      }

      filter.ondata = event => {
         req['response']['body'] = req['response']['body'] + decoder.decode(event.data);
         if (filter.status != "uninitialized" && event.data && event.data.byteLength > 0) {
            filter.write(event.data);
         }
      }

      filter.onerror = event => {
         console.log("!!! error on " + req.url + " -- " + filter.error)
      }

      filter.onstop = event => {
         filter.disconnect();
      }

      var params = new URLSearchParams(urlObj.search);

      req['params'] = parseParams(params);

      if (method == "POST") {
         if (details.requestBody != null) {
               var postBody;
               if (details.requestBody.formData) {
                  postBody = details.requestBody.formData;
               } else {
                  var rawPostData      = new Uint8Array(details.requestBody.raw[0].bytes);
                  // console.log("got rawPostData:\n" + rawPostData);
                  // console.log("****************")
                  var encodedPostData  = String.fromCharCode.apply(null, rawPostData);
                  // console.log("got encodedPostData:\n" + encodedPostData);
                  // console.log("****************")
                  
                  postBody = parseParams(new URLSearchParams('?' + decodeURIComponent(encodedPostData)));
               }
         
               for (var k of Object.keys(postBody)) {
                  req['params'][k] = postBody[k];
               }
         }
      }



      if (isSensitive(req) && !isKnown(req,active_collector)) {
         active_collector.push(req);
         console.log("sensitive request added");
         collected_sensitive_requests++;
      }
      collected_total_request++;
   }

}, {urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "sub_frame","other"]}, ["requestBody","blocking"]);

// this is needed to get response statuses and headers, which are used in
// CSRF evaluation
chrome.webRequest.onResponseStarted.addListener (function (details) {
   var reqId = details.requestId;

   active_collector.forEach( function (el) {
      if (el.reqId == reqId) {
         el.response.status = details.statusCode;
         if (details.responseHeaders) {
            el.response.headers = {};
            details.responseHeaders.forEach( function (h) {
               el.response.headers[h.name] = h.value;
            });
         }
      }
   });
},  {urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "sub_frame","other"]} ,["responseHeaders"]);

function replayRequests(collector) {
   collector.forEach ( function (r) {
      const async = true;                                                               
      let xhr = new XMLHttpRequest();

      if (r['method'].toUpperCase() != "GET" && r['method'].toUpperCase() != "POST")
         console.log("!!! replaying request with unkown method: " + r['method']);

      xhr.open(r['method'],r['url'],async);
      console.log(">>> replaying " + r['method'] + " request to " + r['url']);
      var paramString = [];
      for (var k of Object.keys(r['params'])) {
         // console.log(">|> paramString is: " + paramString);
         paramString.push(k + "=" + encodeURI(r['params'][k]));
      }
      // console.log(">>> paramString is: " + paramString.join("&"));

      if (r['method'].toUpperCase() == "POST")
         xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      xhr.send(paramString.join("&"));

   })
}

function finished_Alice1() {
   console.log("Alice run finished, preparing CSRF test forms...");
   console.log("Please logout from the current session and notify the extension");
   active_collector = null_collector;
   phase = 1;
}

function logged_out_Alice1() {
   console.log("Alice logged out, please login as Bob and notify the extension");
   phase = 2;
}

function logged_in_Bob() {
   console.log("Logged in as Bob, testing sensitive requests...");
   active_collector = bob_requests;
   replayRequests(sensitive_requests);
   console.log("...please logout from Bob's account and notify the extension");
   phase = 3;
}

function logged_out_Bob() {
   console.log("Logged out as Bob, please login as Alice again and notify the extension");
   active_collector = null_collector;
   phase = 4;
}

function logged_in_Alice2() {
   console.log("Logged in as Alice again, testing sensitive requests...");
   active_collector = alice1_requests;
   replayRequests(sensitive_requests);
   console.log("...please logout from Alice's account and notify the extension");
   phase = 5;
}

function logged_out_Alice2() {
   console.log("Logged out as Alice, testing unauth sensitive requests...");
   active_collector = unauth_requests;
   replayRequests(sensitive_requests);

   /* 
      WARN!
      it seems that this null collector happens too soon as we cannot use syncronous xmlhttps
   */
   // active_collector = null_collector;

   console.log("all data collected");
   phase = 6;
}

function make_conclusions() {
   console.log("Making conclusions");
   let candidates = guessCSRFs(sensitive_requests,alice1_requests,bob_requests,unauth_requests);
   console.log("search for possible CSRFs finished, please expand the array presented here to see candidates:");
   console.log(candidates);
   let results_url = chrome.extension.getURL("results.html");
   chrome.tabs.create({"url":results_url, "active":true});
   phase = 7;
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
   if (request.greeting == "get_results")
      sendResponse(tellCSRFs(sensitive_requests,alice1_requests,bob_requests,unauth_requests));
});