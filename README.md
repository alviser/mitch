# mitch
a Machine Learning powered CSRF attacks finding tool

Please find below the usage instructions of the current prototype. We are currently porting all the Python logic to JavaScript to include the full set of functionalities directly inside the extension and improve its usability. We will release Mitch as opensource software when this process is complete.

## System Requirements
Mitch has been developed and tested with ***Linux***, ***python 3.6.3*** with the `genson` package and ***Firefox 58***

## How to use the prototype

Please ensure to have two user accounts Alice and Bob on the website to test

1. Install the Firefox extension under `detector-ext/` using the debug add-on mode

2. Login to the website as Alice and perform the navigation session as desired

3. Click on the extension icon and then on "export as JSON". Save the JSON file as `mysite_alice.json` in `json-directory/`

4. Launch `python create_attacks.py -s json-directory/ -o output-directory/`

5. Open the generated HTML file in Firefox

6. Re-enable the extension and click all the generated links. Export the JSON as `mysite_unauth.json`. Repeat the same process after authenticating as Bob and Alice again: the corresponding JSON files should be named `mysite_bob.json` and `mysite_alice1.json` respectively. Place all the exported JSON files in `json-directory/`

7. Launch `python guess_csrfs.py -s json-directory/ -n mysite` and check the report

If something does not work as expected, please refer to the [Detailed Usage](https://github.com/alviser/mitch/blob/master/DETAILED_USAGE.md) file.

---

## Contents of the repository

### mitch-ext/
Contains the standalone Firefox extension to test a website for CSRFs

### dataset/
Contains the sanitized labelled dataset used to train the classifier

### detector-ext/
Contains the Firefox extension to label navigation requests and the classifier code 

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