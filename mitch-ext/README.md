# mitch-ext
a Machine Learning powered CSRF attacks finding tool - standalone Firefox Extension

## System Requirements
the Mitch extension has been developed and tested with Firefox 61.0b4

## How to use the extension

Please ensure to have two user accounts Alice and Bob on the website to test

1. Login to the website as Alice 

2. Enable the Mitch extension (you may have to use Add-ons debug mode to install it)

3. Perform the navigation session as desired, trying explicitly the forms and interactions you want to test for CSRFs

4. Click on extension's icon and click on `I finished Alice run, continue...`

5. Follow the extension's directions to logout, login and logout as Bob, login and logout as Alice again

6. Enjoy the results!