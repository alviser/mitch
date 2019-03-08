# dataset used in Mitch
This directory contains the datasets used in the paper "Mitch: A Machine Learning Approach to the Black-Box Detection of CSRF Vulnerabilities", published at IEEE EuroS&P 2019. It includes the following files:
- dataset.json: raw HTTP requests collected using HTTP-Tracker
- dataset_prettified.json: the same raw HTTP requests formatted in a more readable way
- features_matrix.csv: feature space representation of the HTTP requests, used for training and testing

Feature information for features_matrix.csv (ordered by column. see the paper for full information):
```
- reqId: continuous
- numParams: continuous
- numOfBools: continuous
- numOfIds: continuous
- numOfBlobs: continuous
- reqLen: continuous
- createInPath: boolean
- createInParams: boolean
- addInPath: boolean
- addInParams: boolean
- setInPath: boolean
- setInParams: boolean
- deleteInPath: boolean
- deleteInParams: boolean
- updateInPath: boolean
- updateInParams: boolean
- removeInPath: boolean
- removeInParams: boolean
- friendInPath: boolean
- friendInParams: boolean
- settingInPath: boolean
- settingInParams: boolean
- passwordInPath: boolean
- passwordInParams: boolean
- tokencreateInPath: boolean
- tokencreateInParams: boolean
- changeInPath: boolean
- changeInParams: boolean
- actionInPath: boolean
- actionInParams: boolean
- payInPath: boolean
- payInParams: boolean
- loginInPath: boolean
- loginInParams: boolean
- logoutInPath: boolean
- logoutInParams: boolean
- postInPath: boolean
- postInParams: boolean
- commentInPath: boolean
- commentInParams: boolean
- followInPath: boolean
- followInParams: boolean
- subscribeInPath: boolean
- subscribeInParams: boolean
- signinInPath: boolean
- signinInParams: boolean
- viewInPath: boolean
- viewInParams: boolean
- isPUT: boolean
- isDELETE: boolean
- isPOST: boolean
- isGET: boolean
- isOPTIONS: boolean
```
If you use our datasets, kindly cite our paper!