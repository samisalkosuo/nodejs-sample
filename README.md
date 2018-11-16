# nodejs sample application for ICP

IBM Cloud Private sample application.

- 






# visualrec-default-app

Sample app using IBM Watson Visual Recognition default classifiers.

This code is based on: https://github.com/IBM-Bluemix/Visual-Recognition-Tile-Localization
and modified.

Application may or may not be available at: https://virecapp.mybluemix.net/.

# Usage

- Get Visual Recognition API key from https://www.ibm.com/watson/services/visual-recognition/.
  - Free usage is 250 requests per day.
- If https://virecapp.mybluemix.net/ exists, go there.
  - Enter API key (key is stored as cookie).
- Upload or take images to detect faces and classify contents.
  - Note that upload takes two requests, first is to detect faces and second is to classify image.

# Local setup

- git clone https://github.com/samisalkosuo/visualrec-default-app.git
- Run app: 
  - npm install && npm start
- Go to http://localhost:6004.
- Use the app.
- To run on Bluemix:
  - Change name and host in manifest.yml.
  - Use cf push to push application to Bluemix.
  - Or, set up a Toolchain in Bluemix to automatically deploy app on commits.
