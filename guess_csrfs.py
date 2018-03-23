# usage:
# python guess_csrfs.py

import json
import sys
import argparse
import genson
import cgi

def get_options(cmd_args=None):
    """
    Parse command line arguments
    """
    cmd_parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    cmd_parser.add_argument(
        '-s',
        '--source_dir',
        help="""Source directory where all the labeled jsons are stored""",
        type=str,
        default='http-tracker/fixed/')
    cmd_parser.add_argument(
        '-n',
        '--base_name',
        help="""Base name used to construct run names""",
        type=str,
        default='')
    cmd_parser.add_argument(
        '-o',
        '--out_name',
        help="""Filename to use for attack comparison HTML page""",
        type=str,
        default='')

    args = cmd_parser.parse_args(cmd_args)

    options = {}
    options['source_dir'] = args.source_dir
    options['base_name'] = args.base_name
    options['out_name'] = args.out_name

    return options

def isHTML(s):
	
	if "</html>" in s['body'].lower():
		return True

	if 'Content-Type' in s['headers'] and "text/html" in s['headers']['Content-Type']:
		return True

	return False

def isJSON(s):
	try:
		j = json.loads(s['body'])
		if isinstance(j, int):
			return False

	except ValueError:
		return False
	return True

def isSameSchema(sA,sB):
	for k in sA:
		if not k in sB:
			return False
		else:
			if isinstance(sA[k],dict) and isinstance(sB[k],dict) and not isSameSchema(sA[k],sB[k]):
				return False
			elif sA[k] != sB[k]:
				return False

	return True

def hasSameJSONSchema(a,b):

	schema_a = genson.SchemaBuilder()
	schema_a.add_object(a)

	schema_b = genson.SchemaBuilder()
	schema_b.add_object(b)

	ret = isSameSchema(schema_a.to_schema(),schema_b.to_schema())
	
	return ret

def compare_request(rA,rB):
	print("comparing " + rA['req']['url'])

	result = {
		'url': rA['req']['url'],
		'params': rA['req']['params'],
		'overall': 'same',
		'method': {},
		'status': {},
		'body': {'ans': 'same'}
	}

	# check status
	statusA = rA['req']['response']['status']
	statusB = rB['req']['response']['status']

	if (statusA == statusB):
		result['status']['ans'] = 'same'
	else:
		result['status']['ans'] = 'different'
		result['overall'] 		= 'different'

	result['status']['valueA'] = statusA
	result['status']['valueB'] = statusB

	# check body type
	if isHTML(rA['req']['response']):
		result['body']['typeA'] = 'html'
	elif isJSON(rA['req']['response']):
		result['body']['typeA'] = 'JSON'
	elif 'Content-Type' in rA['req']['response']['headers'] and "text/plain" in rA['req']['response']['headers']['Content-Type']:
		result['body']['typeA'] = 'plaintext'
	else:
		result['body']['typeA'] = 'plaintext'

	if isHTML(rB['req']['response']):
		result['body']['typeB'] = 'html'
	elif isJSON(rB['req']['response']):
		result['body']['typeB'] = 'JSON'
	elif 'Content-Type' in rB['req']['response']['headers'] and "text/plain" in rB['req']['response']['headers']['Content-Type']:
		result['body']['typeB'] = 'plaintext'
	else:
		result['body']['typeB'] = 'plaintext'

	min_length = min(len(rA['req']['response']['body']), len(rB['req']['response']['body']))
	max_length = max(len(rA['req']['response']['body']), len(rB['req']['response']['body']))
	
	result['body']['ratio'] = (min_length + 1) / (1.0 * max_length + 1)

	if (result['body']['typeA'] == 'JSON' and result['body']['typeB'] == 'JSON'):
		json_a = json.loads(rA['req']['response']['body'])
		json_b = json.loads(rB['req']['response']['body'])
	
		if hasSameJSONSchema(json_a,json_b):
			result['body']['ans'] = 'same'
		else:
			result['body']['ans'] 	= 'different'
			result['overall'] 		= 'different'
	elif (result['body']['typeA'] == 'html' and result['body']['typeB'] == 'html'):
		if (result['body']['ratio'] < 0.99):
			result['body']['ans'] = 'different'
			result['overall'] = 'different'
	elif result['body']['typeA'] == 'plaintext' and result['body']['typeB'] == 'plaintext':
		if rA['req']['response']['body'] != rB['req']['response']['body']:
			result['body']['ans'] 	= 'different'
			result['overall'] 		= 'different'
	else:
		if (result['body']['typeA'] != result['body']['typeB']):
			result['body']['ans'] 	= 'different'
			result['overall'] 		= 'different'

	result['body']['valueA'] = rA['req']['response']['body']
	result['body']['valueB'] = rB['req']['response']['body']

	return result

def isSameReq(req_base,req_test):

	if req_base['req']['url'] != req_test['req']['url']:
		return False

	for p in req_base['req']['params']:
		if not p in req_test['req']['params']:
			return False

	for p in req_test['req']['params']:
		if not p in req_base['req']['params']:
			return False

	return True

def compare_sensitive_requests(runA,runB):
	results = []

	for rA in runA:
		if (rA['flag'] == 'y'):
			found = False
			for rB in runB:
				if isSameReq(rA,rB):
					found = True
					results.append(compare_request(rA,rB))
			
			if (not found):
				print("WARN: could not find the requested URL in runB")

	return results

# isSameEndpoint is an hack of isSameReq to be used to check the structures in the results set of the comparisons

def isSameEndpoint(base,test):
	if base['url'] != test['url']:
		return False

	for p in base['params']:
		if not p in test['params']:
			return False

	for p in test['params']:
		if not p in base['params']:
			return False

	return True

def findRequest(needle,haystack):
	for r in haystack:
		if isSameEndpoint(needle,r):
			return r

	print("WARN! no matching endpoint found for " + needle['url'] + " " + str(needle['params']))
	return False

def comparison_to_html(c,outfile):
	for a in c:
		outfile.write("<h3>" + a['url'] + "</h3>")
		outfile.write("<div class='status " + a['status']['ans'] + "'>status: " + a['status']['ans'] + " <span>[ " + str(a['status']['valueA']) + " ] </span> <span> [ " + str(a['status']['valueB']) + " ]</span></div>")
		outfile.write("<div class='body " + a['body']['ans'] + "'>body: " + a['body']['ans'] + " <span>ratio: " + str(a['body']['ratio']) + "<span></div>")
		outfile.write("<div class='body " + a['body']['ans'] + "'>body type: " + a['body']['typeA'] + " " + a['body']['typeB'] + " <span></div>")

		valueA = a['body']['valueA']
		valueB = a['body']['valueB']
		
		outfile.write("<span class='clickable' onclick='this.nextSibling.nextSibling.style.display=\"block\"'>See response</span>")
		outfile.write("<span class='clickable' onclick='this.nextSibling.style.display=\"none\"'> Hide response</span>")
		outfile.write("<div class='hidden'><table>")
		outfile.write("<tr><td>" + cgi.escape(valueA) + "</td><td>" + cgi.escape(valueB) + "</td></tr>")
		outfile.write("</table></div>")


### main program

def main(options):

	postfixes = {
		'alice': '_alice.json',
		'alice1': '_alice1.json',
		'bob': '_bob.json',
		'unauth': '_unauth.json'
	}

	print(">>> Acquiring traces...")
	alice 	= json.load(open(options['source_dir'] + options['base_name'] + postfixes['alice']))
	alice1 	= json.load(open(options['source_dir'] + options['base_name'] + postfixes['alice1']))
	bob 	= json.load(open(options['source_dir'] + options['base_name'] + postfixes['bob']))
	unauth 	= json.load(open(options['source_dir'] + options['base_name'] + postfixes['unauth']))

	candidates  = []

	print(">>> Performing Traces comparisons...")
	alice_vs_unauth = compare_sensitive_requests(alice,unauth)
	alice_vs_alice1 = compare_sensitive_requests(alice,alice1)
	alice_vs_bob	= compare_sensitive_requests(alice,bob)

	print(">>> Comparisons analisys...")
	print(" >> Confirming sensitivity")
	for r in alice_vs_unauth:
		print("    checking candidate " + r['url'])
		if r['overall'] == 'different':
			print("     candidate added")
			candidates.append(r)

	resulting_candidates = []

	print(" >> Confirming reachability")
	for r in candidates:
		print("    checking candidate " + r['url'])
		r_avb  = findRequest(r,alice_vs_bob)
		r_ava1 = findRequest(r,alice_vs_alice1)
		
		if (r_avb['overall'] == 'different') and (r_ava1['overall'] == 'different'):
			continue

		# candidate confirmed
		resulting_candidates.append(r)

	print("*** possible CSRFs at these URLs:")
	for c in resulting_candidates:
		print(c['url'] + "\n" + str(c['params'])+ "\n---\n")

	# create comparison
	if (options['out_name'] != ''):
		outfile = open(options['out_name'] + "_report.html","w")

		# webpage preamble
		outfile.write("<html>\n")
		outfile.write("<head>\n")
		outfile.write("<style>\n")
		outfile.write(".responseBody { display: none; max-height: 800px; overflow: scroll; background-color: #cccccc;}\n")
		outfile.write("td {  font-family: monospace; vertical-align: top; word-break: break-all; width: 50%; border-right: 2px solid black; padding: 1em; font-size: 12pt !important }\n")
		outfile.write("span.diff_sub { background-color: rgba(255,0,0,.3);}\n")
		outfile.write("span.diff_add { background-color: rgba(0,255,0,.5);}\n")
		outfile.write("span.diff_chg { background-color:  rgba(0,0,255,.3); }\n")
		outfile.write(".same {  color: green }\n")
		outfile.write(".hidden {  display: none }\n")
		outfile.write(".clickable {  cursor: pointer }\n")
		outfile.write("</style>\n")
		outfile.write("</head>\n")
		outfile.write("<body>\n")
		outfile.write("<h1>Comparisons for " + options['base_name'] + "</h1>\n")

		outfile.write("<h2>Alice VS Alice'</h2>")
		comparison_to_html(alice_vs_alice1,outfile)

		outfile.write("<hr /><h2>Alice VS Bob</h2>")
		comparison_to_html(alice_vs_bob,outfile)

		outfile.write("<hr /><h2>Alice VS Unauth</h2>")
		comparison_to_html(alice_vs_unauth,outfile)

		# webpage ending
		outfile.write("</body>\n")
		outfile.write("</html>\n")


if __name__ == "__main__":
    sys.exit(main(get_options()))
