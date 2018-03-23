# How to use mitch
with a lot of details

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
* browse the website as much as you want, expecially excercising security critical operations (change password, add friends, whatever... ). A red exclamation mark on the detective icon means it is collecting data.

### step 4: save labelled navigation
* click on the detective icon
* click on `export as Json`
* select a location to save the file to (e.g. `json-go-here/`)
* name the file `site_alice.json` and save it (you can change the `site`, but you have to keep the `_alice.json` part of the name)
* press `SHIFT+CTRL+A` again to switch back to the Add-ons window, and click `Disable` button on the request labeller add-on
* logout from Alice account

### step 5: generate tests
* from a console launch `python create_attacks.py -s json-go-here/ -o put-tests-here/`

### step 6: load tests into Firefox
* open the file in `put-tests-here/site_alice.json.html` with Firefox

### step 7: do the tests as Bob
* in a fresh tab log in using Bob (account B) credentials
* press `SHIFT+CTRL+A` to switch back to the Add-ons window, and click `Enable` button on the request labeller add-on
* go to the tab with the file you opened in step 6
* click on all the `test CSRF` buttons you find in the page
* notice that the detective is collecting data
* click on the detective icon
* click on `export as Json`
* select a location to save the file to (e.g. `json-go-here/`)
* name the file `site_bob.json` and save it (you can change the `site`, but you have to keep the `_bob.json` part of the name)
* press `SHIFT+CTRL+A` again to switch back to the Add-ons window, and click `Disable` button on the request labeller add-on
* logout from Bob account

### step 8: do the tests as Alice - again
* repeat all actions in step 7 logging in again as Alice, and save the navigation as `site_alice1.json` (you can change the `site`, but you have to keep the `_alice1.json` part of the name)
* logout from Alice account

### step 9: do the tests as unauthenticated user
* repeat all actions in step 7 without logging in and save the navigation as `site_unauth.json` (you can change the `site`, but you have to keep the `_unauth.json` part of the name)

### step 10: find CSRFs! (or not, hopefully ;) )
* from a console launch `python guess_csrfs.py -s json-go-here/ -n site`
* enjoy the results