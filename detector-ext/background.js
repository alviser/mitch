'use strict';

var worklist  = [];    // yet unlabelled requests
var goldset   = [];    // already labelled requests

var visitingURLObj;

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
      if (compareReq(g.req,r))
         flag = true;
   });

   return flag;
}

// Empties the list of yet unlabelled requests, asking the user to label them
function flush() {
   var b = [];
   for (var i = 0; i < worklist.length; i++)
      b.push(false);   

   for (var i = 0; i < worklist.length - 1; i++) {
      for (var j = i + 1; j < worklist.length; j++)
         if (compareReq(worklist[i],worklist[j]))
            b[j] = true;         
   } 

   var wl = [];
   for (var i = 0; i < worklist.length; i++)
      if (!b[i])
         wl.push(worklist[i]);

      wl.forEach (function (r) {
         var c;

         if (isSensitive(r)) {
            c = 'y';
         } else {
            c = 'u';
         }
         goldset.push({'req': r, 'flag': c, 'comment': ''});
      });

   worklist = [];
   chrome.browserAction.setBadgeText({text: ""});
}

function countParams(req) {
   return Object.keys(req['params']).length;
}

function countBools(req) {
   var numBools = 0;

   for (var p of Object.keys(req['params'])) {
      if (req['params'][p] == 'true' ||
               req['params'][p] == 'false' || 
               req['params'][p] == '1' || 
               req['params'][p] == '0') {
            numBools++; 
         }
   }

   return numBools;
}

function countIds(req) {
   var numOfIds = 0;
   var re = RegExp('^[0-9]{14}|[0-9\-a-fA-F]{20,}$');

   for (var p of Object.keys(req['params'])) {
      if (re.test(req['params'][p]))
         numOfIds++; 
   }

   return numOfIds;
}

function countBlobs(req) {
   var numOfBlobs = 0;
   var re = RegExp('^[^\s]{20,}$');

   for (var p of Object.keys(req['params'])) {
      if (re.test(req['params'][p]))
         numOfBlobs++; 
   }

   return numOfBlobs;
}

function getReqLen(req) {
   var l=0;

   for (var p of Object.keys(req['params'])) {
      l = l + p.length + String(req['params'][p]).length;
   }
   return l;
}

function isInPath(req,needle) {
   var tkns = req['url'].split('/');
   for (var i = 2;i<tkns.length;i++) {
      if (tkns[i].toLocaleLowerCase().includes(needle.toLocaleLowerCase())) {
         return 1;
      }
   }
   return 0;
}

function isInParams(req,needle) {
   for (var p of Object.keys(req['params'])) {
      if (p.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) {
         return 1;
      }
   }
   return 0;
}


function isSensitive(req) {
   var featureVector = [];

   if (req['method'].toLocaleUpperCase == 'PUT' || 
         req['method'].toLocaleUpperCase == 'DELETE')
      return true;

   if (req['method'].toLocaleUpperCase == 'OPTIONS')
      return false;

   // numOfParams
   featureVector.push(countParams(req));
   // numOfBools
   featureVector.push(countBools(req));
   // numOfIds
   featureVector.push(countIds(req));
   // numOfBlobs
   featureVector.push(countBlobs(req));
   // reqLen
   featureVector.push(getReqLen(req));

   var keywords = ['create','add','set','delete','update','remove', 
   'friend', 'setting','password','token','change','action', 
   'pay','login','logout', 'post','comment','follow','subscribe','sign','view'];
   
   keywords.forEach(function (k) {
      featureVector.push(isInPath(req,k));
      featureVector.push(isInParams(req,k));
   });

   var methods = ['PUT','DELETE','POST','GET','OPTIONS'];

   methods.forEach(function (m) {
      featureVector.push((req['method'].toLocaleUpperCase() == m)?1:0);
   });

   console.log(featureVector);
   var sensitive = classifier.predict(featureVector);
   console.log("request is sensitive: " + sensitive);
   return sensitive;
}


// Builds a worklist of HTTP requests to be labelled
chrome.webRequest.onBeforeRequest.addListener (function (details) {
   var urlObj = new URL(details.url);
   if (details.type == "main_frame") {
      visitingURLObj = new URL(details.url);
   }

   if (goodUrl(urlObj, visitingURLObj)) {

      var method = details.method;   
      
      var urlClean = urlObj.protocol + "//" + urlObj.hostname + urlObj.pathname;
      var req = {'method': method, 'url': urlClean, 'params': {}, 'reqId': details.requestId, 'response' : {}};
      console.log('reasoning on: ' + req['url']);
      req['response']['body'] = "";

      var filter = browser.webRequest.filterResponseData(details.requestId);

      var decoder = new TextDecoder();

      filter.onstart = event => {
         console.log("starting " + req['url'] + " [ " + filter.status + " ] ");
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
                  console.log("got rawPostData:\n" + rawPostData);
                  console.log("****************")
                  var encodedPostData  = String.fromCharCode.apply(null, rawPostData);
                  console.log("got encodedPostData:\n" + encodedPostData);
                  console.log("****************")
                  
                  postBody = parseParams(new URLSearchParams('?' + decodeURIComponent(encodedPostData)));
               }
         
               for (var k of Object.keys(postBody)) {
                  req['params'][k] = postBody[k];
               }
         }
      }



      if (!isKnown(req,goldset)) {
         worklist.push(req);
         chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
         chrome.browserAction.setBadgeText({text: "!"});
      }
   }

}, {urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "sub_frame","other"]}, ["requestBody","blocking"]);

chrome.webRequest.onResponseStarted.addListener (function (details) {
   var reqId = details.requestId;

   worklist.forEach( function (el) {
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

   goldset.forEach( function (el) {
      if (el.req.reqId == reqId) {
         el.req.response.status = details.statusCode;
         if (details.responseHeaders) {
            el.req.response.headers = {};
            details.responseHeaders.forEach( function (h) {
               el.req.response.headers[h.name] = h.value;
            });
         }
      }
   });
},  {urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "sub_frame","other"]} ,["responseHeaders"]);