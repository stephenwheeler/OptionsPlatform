# OptionsPlatform
Using Questrade API to calculate return and risk on options trades.

Setup
-----

In a Google Sheet, upload files
- choose Extensions --> Apps Script. This will launch Apps scripts in a new tab. 
= in the left column, click on the <> icon.
- add each file using the Files + button.
- in the left column, click on gear icon (Settings).
    - copy the Script Id value. You will need this in Questrade.


In Questrade, navigate to My apps
- click on your name in top right --> Settings.
- click on IQ API in left column.
- scroll down to IQ API, API access and click Edit.
- find My applications and click on Manage.

Register a personal app in Questrade
- click on Register a Personal App
- Name the app e.g. Option Prices 
- check the Retrieve balances, positions, orders and executions
- check the Retrieve delayed and real-time market data
- paste in a Callback URL for your Google spreadsheet, currently in this form:
    https://script.google.com/macros/d/<<< Google Apps Script Id >>>/usercallback

    <<< Google Apps Script Id >>> - see above for how to retrieve this value.

Building a Sheet
----------------

In a Google Sheet, insert a drawing with a single rectangle with text "Authorize" and Save the drawing.
Right-click on the rectangle, then left click on the 3 dots to bring up the menu. Choose Assign Script.
In the Assign Script dialog, put:
    showSidebar
Press OK on the dialog.
Click on the Authorize rectangle/button and a sidebar will appear on the right. Click on the Authorize link.
This will redirect you to Questrade to sign in and authorize the Google Sheet.
Now you are authorized and you can use the other functions to make calls to the Questrade API.
E.g. create another button that will invoke another function using Assign Script.

doStockQuotesColumn
getOptionExpiryListFromStockSymbolId
getOptionsChainFromCells
getOptionsMatrixFromCells

Finally, look at OptionsOAuth.xlsx for examples of how to structure input cells so the functions
can read the input parameters from the cells.

Usage
-----
Press the Authorize button, and Authorize in Questrade if you are not already authorized.
Press other buttons and watch the script run and update cells in the spreadsheet.

For example, getOptionsMatrixFromCells will create matrices to show the ROI for vertical calls.

	    415	    410	    405	    400	    395	    390	    385	    380	    375	    370	    365	    360

415	    .0%	    68.5%	69.3%	71.3%	71.5%	73.2%	74.3%	75.3%	76.2%	77.0%	77.8%	78.9%
410	    46.0%	.0%	    70.0%	72.8%	72.5%	74.4%	75.4%	76.4%	77.3%	78.1%	78.8%	79.9%
405	    44.4%	42.9%	.0%	    75.5%	73.8%	75.8%	76.8%	77.7%	78.5%	79.2%	79.9%	81.0%
400	    40.2%	37.5%	32.5%	.0%	    72.0%	76.0%	77.2%	78.3%	79.1%	79.8%	80.5%	81.7%
395	    39.9%	37.9%	35.6%	38.9%	.0%	    80.0%	79.8%	80.3%	80.9%	81.4%	81.9%	83.1%
390	    36.6%	34.5%	31.9%	31.6%	25.0%	.0%	    79.5%	80.5%	81.2%	81.8%	82.3%	83.6%
385	    34.7%	32.6%	30.3%	29.6%	25.4%	25.8%	.0%	    81.5%	82.0%	82.5%	83.0%	84.4%
380	    32.8%	30.9%	28.7%	27.8%	24.5%	24.2%	22.7%	.0%	    82.5%	83.0%	83.5%	85.1%
375	    31.3%	29.4%	27.4%	26.4%	23.6%	23.2%	22.0%	21.2%	.0%	    83.5%	84.0%	86.0%
370	    29.9%	28.1%	26.2%	25.3%	22.9%	22.3%	21.2%	20.5%	19.8%	.0%	    84.5%	87.3%
365	    28.6%	26.9%	25.2%	24.2%	22.1%	21.5%	20.5%	19.8%	19.0%	18.3%	.0%	    90.0%
360	    26.8%	25.2%	23.5%	22.4%	20.4%	19.6%	18.5%	17.5%	16.3%	14.6%	11.1%	.0%