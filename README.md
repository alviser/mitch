# mitch
a Machine Learning powered CSRF attacks finding tool

Please find below the usage instructions of the current prototype. We are currently porting all the Python logic to JavaScript to include the full set of functionalities directly inside the extension and improve its usability. We will release Mitch as opensource software when this process is complete.

## System Requirements
Mitch has been tested with ***python 3.6.3*** and ***Firefox 58***

## How to use it

### step 0: prerequisites
* please ensure to have two user accounts accessible on the website you want to test

### step 1: install the Firefox extension
* within Firefox press `SHIFT+CTRL+A` to open the Add-ons window
* click on the little cog in the upper right near the search field, and select `Debug add-ons`.
* from the window that just opened select the `Load temporary add-on` button and browse to the extension directory, then click `Open`.
* you'll notice a little detective icon appeared, usually on the right of the address bar
* press `SHIFT+CTRL+A` again to switch back to the Add-ons window, and click `Disable` button on the request labeller add-on

### step 2: login with Alice (account A)
* log in into the website using Alice (account A) credentials
* press `SHIFT+CTRL+A` to switch back to the Add-ons window, and click `Enable` button on the request labeller add-on
* notice the detective icon near the address bar 

### step 3: perform navigation
* browse the website as much as you want, expecially excercising security critical operations (change password, add friends, whatever... )

### step 4: save labelled navigation
* click on the detective icon
* click on `export as Json`
* select a location to save the file to (e.g. `json-go-here/`)
* name the file `site_alice.json` and save it
* press `SHIFT+CTRL+A` again to switch back to the Add-ons window, and click `Disable` button on the request labeller add-on
* logout from Alice account

### step 5: generate tests
* from a console launch `python create_attacks.py -s json-go-here/ -o put-tests-here/`

### step 6: load tests into Firefox
* open the file in `put-tests-here/site_alice.json.html` with Firefox

### step 7: repeat navigations
* repeat steps 2,3,4 using Bob (account B) credentials, Alice credentials for a second time, and without logging in respectively and saving JSONs as `json-go-here/site_bob.json`,`json-go-here/site_alice1.json` and `json-go-here/site_unauth.json`

### step 8: find CSRFs! (or not, hopefully ;) )
* from a console launch `python guess_csrfs.py -s json-go-here/ -n site`
* enjoy the results

---

## Contents of the repository

### detector-ext/
It contains the Firefox extension to label navigation requests and the classifier code 

#### usage
Load it in Firefox and activate it if necessary.

When navigation has been finished save the resulting JSON from the "detective" icon.

### create_attacks.py
This script has to be run against a labelled navigation saved from the detector-ext and outputs an HTML page with specially crafted forms used to replay such navigation.

#### usage
`python create_attacks.py -s <directory-containing-jsons-navigations> -o <directory-where-to-put-attack-test-form>`

e.g.
`python create_attacks.py -s get-jsons-here/ -o put-attacks-here/`

### guess_csrfs.py
This scripts compares the various run and find possible CSRFs.
All the JSONs with the runs data need to be stored in the same directory and follow this naming convention:

* `<sitename>_alice.json`
* `<sitename>_alice1.json`
* `<sitename>_bob.json`
* `<sitename>_unauth.json`

It supports an optional `-o <reportname>` to produce a detailed report of it comparisons

#### usage
`python guess_csrfs.py -s <directory-with-jsons/> -n <sitename> [-o <reportname>]`

e.g.
with `example.com_alice.json`,`example.com_alice1.json`,`example.com_bob.json`,`example.com_unauth.json` in `get-jsons-here/` 

`python guess_csrfs.py -s get-jsons-here/ -n example.com`