'use strict';

function guessCSRFs(alice,alice1,bob,unauth) {
   console.log(">>> comparing traces...");
   var alice_vs_unauth  = compare_sensitive_requests(alice,unauth);
   var alice_vs_alice1  = compare_sensitive_requests(alice,alice1);
   var alice_vs_bob     = compare_sensitive_requests(alice,bob);

   var candidates = [];

   console.log(">>> comparisons analisys:");
   console.log(" >> confirming sensitivity");
   for (let r of alice_vs_unauth) {
      console.log("    checking " + r['url']);
      if (r['overall'] == 'different') {
         console.log("    candidate added");
         candidates.push(r);
      }
   }

   var resulting_candidates = [];
   console.log(" >> confirming reachability");
   for (let c of candidates) {
      console.log("    checking " + c['url']);
      let r_avb = findRequest(c,alice_vs_bob);
      let r_ava1 = findRequest(c,alice_vs_alice1);

      if (r_avb['overall'] == 'different' && r_ava1['overall'] == 'different')
         continue;

      resulting_candidates.push(c);
   }

   return resulting_candidates;
}

function tellCSRFs(alice,alice1,bob,unauth) {
   var output = "<ol>";
   output = output + "<li>comparing traces...</li>";
   var alice_vs_unauth  = compare_sensitive_requests(alice,unauth);
   var alice_vs_alice1  = compare_sensitive_requests(alice,alice1);
   var alice_vs_bob     = compare_sensitive_requests(alice,bob);

   var candidates = [];

   output = output + "<li>comparisons analisys:<ol>";
   output = output + "<li>confirming sensitivity:<ul>";
   for (let r of alice_vs_unauth) {
      output = output + "<li>checking " + r['url'] + "...";
      if (r['overall'] == 'different') {
         output = output + "candidate added";
         candidates.push(r);
      }
      output = output + "</li>";
   }
   output = output + "</ul></li>"
   var resulting_candidates = [];
   output = output + "<li>confirming reachability:<ul>";
   for (let c of candidates) {
      output = output + "<li>checking " + c['url'] + "</li>";
      let r_avb = findRequest(c,alice_vs_bob);
      let r_ava1 = findRequest(c,alice_vs_alice1);

      if (r_avb['overall'] == 'different' && r_ava1['overall'] == 'different')
         continue;

      resulting_candidates.push(c);
   }
   output = output + "</ul></ol></li>";
   output = output + "<li>the following URLs may be vulnerable to CSRFs (check console output for more details):<ul>";
   for (let pc of resulting_candidates) {
      output = output + "<li>" + pc['url'] + "</li>";
   }
   output = output + "</ul></li></ol>";

   return output;
}


/* FIXME: this function is not complete, for example it is wrong on regexps */
function isDict(v) {
    typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}

function isSameSchema(sA,sB) {
   for (let k of Object.keys(sA)) {
      if (!(k in sB)) {
         return false;
      } else { 
         if (isDict(sA[k]) && isDict(sB[k]) && !isSameSchema(sA[k],sB[k])) {
            return false;
         } else if (sA[k] != sB[k]) {
            return false;
         }
      }
   }

   return true;
}

function hasSameJSONSchema(a,b) {
   let sA = getSchema(a);
   let sB = getSchema(b);

   let ret = isSameSchema(sA,sB);
   return ret;
}

function isHTML(s) {
   if (s['body'].toLowerCase().includes("</html>"))
      return true;

   if ('Content-Type' in s['headers'] && s['headers']['Content-Type'].includes("text/html"))
      return true;

   return false;
}

function isJSON(s) {
   try {
      let j = JSON.parse(s['body']);
      if (Number.isInteger(j))
         return false;
   } catch (e) {
      return false;
   }
   return true;
}

function compare_requests(rA,rB) {
   let result = {
      'url': rA['url'],
      'params': rA['params'],
      'overall': 'same',
      'method': {},
      'status': {},
      'body': {'ans': 'same'}
   };

   // checking status
   let statusA = rA['response']['status'];
   let statusB = rB['response']['status'];

   if (statusA == statusB) {
      result['status']['ans'] = 'same';
   } else {
      result['status']['ans'] = 'different';
      result['overall']       = 'different';
   }

   result['status']['valueA'] = statusA;
   result['status']['valueB'] = statusB;

   // checking body type
   if (isHTML(rA['response'])) {
      result['body']['typeA'] = 'html';
   } else if (isJSON(rA['response'])) {
      result['body']['typeA'] = 'json';
   } else {
      result['body']['typeA'] = 'plaintext';
   }

   if (isHTML(rB['response'])) {
      result['body']['typeB'] = 'html';
   } else if (isJSON(rB['response'])) {
      result['body']['typeB'] = 'json';
   } else {
      result['body']['typeB'] = 'plaintext';
   }

   let min_length = Math.min(rA['response']['body'].length,rB['response']['body'].length);
   let max_length = Math.max(rA['response']['body'].length,rB['response']['body'].length);

   result['body']['ratio'] = (min_length + 1) / (1.0 * max_length + 1);

   if (result['body']['typeA'] == 'JSON' && result['body']['typeB'] == 'JSON') {
      var json_a = JSON.parse(rA['response']['body']);
      var json_b = JSON.parse(rB['response']['body']);

      if (hasSameJSONSchema(json_a,json_b)) {
         result['body']['ans'] = 'same';
      } else {
         result['body']['ans']   = 'different';
         result['overall']       = 'different';
      }
   } else if (result['body']['typeA'] == 'html' && result['body']['typeB'] == 'html') {
      if (result['body']['ratio'] < 0.99) {
         result['body']['ans'] = 'different';
         result['overall'] = 'different';
      }
   } else if (result['body']['typeA'] == 'plaintext' && result['body']['typeB'] == 'plaintext') {
      if (rA['response']['body'] != rB['response']['body']) {
         result['body']['ans']   = 'different';
         result['overall']       = 'different';
      }
   } else {
      if (result['body']['typeA'] != result['body']['typeB']) {
         result['body']['ans']   = 'different';
         result['overall']       = 'different';
      }
   }

   result['body']['valueA'] = rA['response']['body'];
   result['body']['valueB'] = rB['response']['body'];

   return result;
}

function isSameReq(base,test) {
   if (base['url'] != test['url'])
      return false;

   for (let k of Object.keys(base['params'])) {
      if (!(k in test['params']))
         return false;
   }

   for (let p of Object.keys(test['params'])) {
      if (!(p in base['params']))
         return false;
   }

   return true;
}

function isSameEndpoint(base,test) {
   if (base['url'] != test['url'])
      return false;

   for (let k of Object.keys(base['params'])) {
      if (!(k in test['params']))
         return false;
   }

   for (let p of Object.keys(test['params'])) {
      if (!(p in base['params']))
         return false;
   }

   return true;
}

function findRequest(needle, haystack) {
   for (let r of haystack) {
      if (isSameEndpoint(needle,r))
         return r;
   }
   console.log("!!! no matching endpoint found for " + needle['url']);
   return false;
}

function compare_sensitive_requests(runA,runB) {
   let results = [];
   
   for (let rA of runA) {
      let found = false;
      for (let rB of runB) {
         if (isSameReq(rA,rB)) {
            found = true;
            results.push(compare_requests(rA,rB));
         }
      }

      if (!found)
         console.log("!!! could not find " + rA['url'] + " in runB");
   }

   return results;
}