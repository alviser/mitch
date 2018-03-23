# usage:
# python create_attacks.py -s source directory/ -o target directory
#
# for every json file in source directory creates an HTML webpage with forms to test CSRFs

import json
import sys
import os
import argparse
import cgi
import codecs

def get_options(cmd_args=None):
    """
    Parse command line arguments
    """
    cmd_parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    cmd_parser.add_argument(
        '-o',
        '--output_dir',
        help="""Path to the output directory containing the attack tests.""",
        type=str,
        default='attacks/')
    cmd_parser.add_argument(
        '-s',
        '--source_dir',
        help="""Source directory where all the labeled jsons are stored""",
        type=str,
        default='jsons/')

    args = cmd_parser.parse_args(cmd_args)

    options = {}
    options['output_dir'] = args.output_dir
    options['source_dir'] = args.source_dir

    return options

def createTest(req,out):
	if (req['req']['method'] not in ['GET','POST']):
		out.write("<hr />\n")
		out.write(req['req']['method'] + " not yet supported for " + req['req']['url'])
		return False

	out.write("<hr/>")
	out.write("<h3>" + req['req']['method'] + " " + req['req']['url'] + "</h3>\n")
	out.write("<h6>" + req['comment'] + "</h6>\n")
	out.write("<form action='" + req['req']['url'] + "' method='" + req['req']['method']+ "' target='_new'>")
	out.write("<ul>")
	for p in req['req']['params']:
		out.write("<li>")
		out.write("<span class='paramname'>" + p + "</span> ")
		out.write("<input type='text' name='" + p + "' value='" + str(req['req']['params'][p][0]) + "'/>")
		if req['req']['params'][p][0] == None:
			out.write("WARN: value was <code>null</code>")
		out.write("</li>")
	out.write("</ul>")
	out.write("<input type='submit' value='test csrf' onclick='this.style.backgroundColor=\"#aa0000\"' />")
	out.write("</form>")
	out.write("<span onclick='this.nextSibling.nextSibling.style.display=\"block\"'>See expected response</span>")
	out.write("<span onclick='this.nextSibling.style.display=\"none\"'> Hide expected response</span>")
	out.write("<div class='responseBody'>")
	out.write("STATUS: " + str(req['req']['response']['status']))
	out.write("<pre>")
	out.write(cgi.escape(req['req']['response']['body']))
	out.write("</pre>")
	out.write("</div>")
	return True

### main program

def main(options):
	if not os.path.exists(options['output_dir']):
		os.makedirs(options['output_dir'])

	# loading data
	for filename in os.listdir(options['source_dir']):

		sitename = ".".join(filename.split(".")[:-2])

		print("working on: " + sitename + " / " + filename)

		j = json.load(codecs.open(options['source_dir'] + filename, encoding='utf-8'))
		outfile = open(options['output_dir'] + filename + ".html","w")
		
		# webpage preamble
		outfile.write("<html>\n")
		outfile.write("<head>\n")
		outfile.write("<style>\n")
		outfile.write(".responseBody { display: none; max-height: 800px; overflow: scroll; background-color: #cccccc;}\n")
		outfile.write("</style>\n")
		outfile.write("<title>" + filename + " attack ground</title>")
		outfile.write("</head>\n")
		outfile.write("<body>\n")
		outfile.write("<h1>CSRF tests for " + sitename + "</h1>\n")
		outfile.write("please make sure you are logged in to the website in another tab<br />")

		# tests construction
		for r in j:
			if r['flag'] == 'y':
				createTest(r,outfile)
				
		# webpage closure
		outfile.write("</body>\n")
		outfile.write("</html>\n")

		outfile.close()

if __name__ == "__main__":
    sys.exit(main(get_options()))