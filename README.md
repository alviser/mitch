# mitch
a Machine Learning powered CSRF attacks finding tool

Please find below the usage instructions of the current prototype. We are currently porting all the Python logic to JavaScript to include the full set of functionalities directly inside the extension and improve its usability. We will release Mitch as opensource software when this process is complete.

## System Requirements
Mitch has been developed and tested with ***Linux***, ***python 3.6.3***, the `genson` package and ***Firefox 58***



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