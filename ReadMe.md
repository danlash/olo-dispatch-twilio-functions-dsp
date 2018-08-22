# Olo Dispatch DSP implemented with Twilio Functions 

# Setup
1) Create a Twilio account and buy a phone number that supports SMS
1) Create a Function for each of these files, without "Check for valid Twilio signature":
    1) RequestQuote.js as /quote
    1) AcceptQuote.js as /accept
    1) ReceiveSMS.js as /receive
    1) SendSMS.js as /send
1) Create priveate Assets for each of these files:
    1) Drivers.js
    1) Dispatch.js
    1) RestDB.js
    1) SMS.js
1) Create a public Asset for:
    1) index.js
1) Configure the phone number to invoke the ReceiveSMS Function
1) Add these environmental configuration items:
    1) DISPATCH_API_KEY = key provided by Olo Dispatch
    1) DISPATCH_URL = base url with /v1 at the end
    1) PICKUP_MINUTES = 5
    1) TRANSIT_MINUTES = 15
    1) RESTDB_API_KEY = key provided by RestDB.io
    1) RESTDB_URL = url of your RestDB
    1) TWILIO_PHONE_NUMBER = your twilio phone number
1) Add these NPM dependencies:
    1) moment
    1) got
    1) uuid
1) Check the Enable ACCOUNT_SID and AUTH_TOKEN box
1) Create a RestDB.io account with one database and one table called Drivers and columns:
    1) phone_number
    1) zip_codes
    1) fee
    1) current_delivery_id

# Dispatch
1) You must be running a custom branch of Dispatch for the integration to work, called twilio-functions-as-a-dsp
1) If your machine is not publically accessible, you must run ngrok type proxy receive status updates from Twilio
1) Create a DSP record using Portal, use the Twilio integration type and the root url of your Twilio Functions account, also use Ignore Service Area

# Usage
1) Visit your public index page to start the process of driving!