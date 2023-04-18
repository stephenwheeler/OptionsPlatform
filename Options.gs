
function getOptionsQuote(stock_id, expiry){
  stock_id = 38526;
  var payload = {
    filters: [
        {
             optionType: 'Call',
             underlyingId: stock_id,
             expiryDate: '2022-03-18T00:00:00.000000-05:00',
             minstrikePrice: 900,
             maxstrikePrice: 1000
        },
    ],
    optionIds: [
        28908433,
        9907638
    ]
  };
  return invokeQuestradeUrl('v1/markets/quotes/options', JSON.stringify(payload));
}

function getOptionsQuoteParams_test(){
  result = getOptionsQuoteParams()
  console.log(result)
}

function getOptionsQuoteParams(stock_id = 28768, expiry = "2023-04-21T00:00:00.000000-05:00",     min_strike = 280, max_strike = 330){
  // console.log(stock_id, " ", expiry, " ", min_strike, " ", max_strike, "\n")
  var payload = {
    filters: [
        {
             optionType: 'Call',
             underlyingId: stock_id,
             expiryDate: expiry, // '2022-03-18T00:00:00.000000-05:00',
             minstrikePrice: min_strike,
             maxstrikePrice: max_strike
        },
    ],
  };
  var s_result = invokeQuestradeUrl('v1/markets/quotes/options', JSON.stringify(payload));

  var result = JSON.parse(s_result);

  if (result.optionQuotes.length == 0){
    alert_message = "No options available: \n" + expiry;
    console.error(alert_message);
    SpreadsheetApp.getUi().alert( alert_message); // Comment out for debugging.
  }

  result.optionQuotes.forEach ( parseRow );
  return result
}

function getOptionsChainFromCells(){
  return getOptionsDataFromCells(false);
}

function getOptionsMatrixFromCells(){
  return getOptionsDataFromCells(true);
}

function getOptionsDataFromCells(b_include_matrix){
  // TODO: pull this out into a getStockSymbolIdFromCell().
  var params = getParameterCells()[0];
  var stock_id = null;
  
  // Get the Stock SymbolId from Stock symbol and save in f2.
  stock_id = getSymbolId(params[0])

  console.log(stock_id);
  var cell_values = [[ stock_id ]];
  cellsSetValue('f2', cell_values); // Persist stock_id to spreadsheet.
  
  stock_price = getStockLastPrice(stock_id)
  cellsSetValue('b2', [[stock_price]], dollar_format);

  // Get Option quotes for all options between min/max strike prices.
  var result = getOptionsQuoteParams(stock_id,params[2], params[3], params[4]);

  // Clear the spreadsheet of previous values.
  cellsClearRange('c5:z100');

  var num_options = outputChainToSpreadsheet(result);

  if (b_include_matrix){
    outputMatrixValuesToSpreadsheet(result, calculateVerticalCallROI, result.optionQuotes.length + 3, 'c', stock_price, percentage_format);

    outputMatrixValuesToSpreadsheet(result, calculateVerticalCallSafety, (result.optionQuotes.length + 3) * 2, 'c', stock_price, percentage_format);

    outputMatrixValuesToSpreadsheet(result, calculateVerticalCallOverallScore, (result.optionQuotes.length + 3) * 3, 'c', stock_price, two_decimals_format);
  }

  return result.optionQuotes.length;
}

function outputMatrixValuesToSpreadsheet( chain, matrix_values_function, row_offset, column, stock_price, format ){
    // var result = JSON.parse(chain);

    var a_options = chain.optionQuotes;
    row_offset = row_offset ? parseInt(row_offset) : a_options.length * 2 + 10;  // Spacing the matrices on the spreadsheet.
    column = column ? column : 'f';
    var _range = '';
    var result = 0;
    for (let bought in a_options){
        for (let sold in a_options){
            _range = getNextLetter(column, sold);
            _range = _range + (parseInt(bought)+row_offset);
            if (bought==0 && sold==0){
                // Do nothing.
            } else if (bought==0){
                // Output top row of strike prices.
                console.log(bought, ',', sold, a_options[sold].strike);
                cellsSetValue( _range, [[a_options[sold].strike]], int_format );
            } else if (sold == 0) {
                // Output left column of strike prices.
                console.log(bought, ',', sold, a_options[bought].strike);
                cellsSetValue( _range, [[a_options[bought].strike]], int_format );
            } else {
                result = matrix_values_function(a_options[bought], a_options[sold], stock_price);
                console.log(bought, ',', sold, result);
                cellsSetValue( _range, [[result]], format );
            }
        }
    }
}

function CallIntrinsicValue2(strike, stock, shares) {
  //Utilities.sleep(1000);
  if(strike > stock){
    return (strike - stock) * shares;
  }
  else {
    return 0;
  }
}

function calculateVerticalCallSafety(bought_option, sold_option, stock_price){
  if (!bought_option){
    bought_option = { strike:770, askPrice:203 };
    sold_option = { strike: 820, bidPrice: 176.15 };
    // bought_option = { strike:120, askPrice:10 };
    // sold_option = { strike: 100, bidPrice: 20 };
  }
  stock_price = stock_price ? parseFloat(stock_price) : 100;

  var safety = optionSafetyMargin(bought_option, sold_option, stock_price);
  
  return safety;
}

function optionSafetyMargin(bought_option, sold_option, stock_price){
  var safety = 0;
  var breakeven = 0;
  var spread = optionSpread(bought_option, sold_option);
  var cost = optionCost(bought_option, sold_option);
  if (spread > 0){
    breakeven = parseFloat(bought_option.strike) + cost;
    safety = (stock_price - breakeven) / stock_price;
  } else if (spread < 0 ){
    breakeven = parseFloat(sold_option.strike) - cost;
    safety = breakeven / stock_price - 1;
  }
  return safety;
}

function optionCost(bought_option, sold_option){
  var cost = 0;
  if (bought_option.askPrice && sold_option.bidPrice){
    var best = parseFloat(bought_option.bidPrice) - parseFloat(sold_option.askPrice);
    var worst = parseFloat(bought_option.askPrice) - parseFloat(sold_option.bidPrice);
    cost = (Math.abs(best) + Math.abs(worst))/2.0;
  } else {
    // Bid and Ask only available when the market is open.
    cost = parseFloat(bought_option.lastTradePrice) - parseFloat(sold_option.lastTradePrice);
  }
  return cost;
}

function optionCost_test()
{
  var b = {};
  var s = {};
  b.askPrice = 8.0;
  b.bidPrice = 7.0;
  s.bidPrice = 1.0;
  s.askPrice = 2.0;
  // Positive best price.
  if ( optionCost(b,s) != 6 ){
    throw Exception;
  }

  // Negative best price.
  s = { bidPrice:81.90, askPrice:87.30 };
  b = { bidPrice:84.30, askPrice:90.90 };
  if ( optionCost(b,s) != 6 ){
    throw Exception;
  }

  // Cost is a credit e.g. Sell lower call, buy higher call
  s = { bidPrice:10, askPrice:20 }
  b = { bidPrice:5, askPrice:10 }
  if ( optionCost(b,s) != -7.5){
    console.log( optionCost(b,s) )
    throw Exception;
  }
}

function calculateVerticalCallOverallScore(bought_option, sold_option, stock_price){
  stock_price = stock_price ? parseFloat(stock_price) : 100;
  // Get ratio factor from cell.
  var factor = 3;
  var safety = optionSafetyMargin(bought_option, sold_option, stock_price);
  var spread = optionSpread(bought_option, sold_option);
  var cost = optionCost(bought_option, sold_option);
  var roi = optionROI(spread, cost);
  var result = safety * factor + roi;
  return result;
}

function optionSpread(bought_option, sold_option){
  var spread = parseFloat(sold_option.strike) - parseFloat(bought_option.strike);
  return spread;
}

function calculateVerticalCallROI(bought_option, sold_option, stock_price){
    if (!bought_option){
      bought_option = { strike:765, bidPrice:144.3, askPrice:152.7 };
      sold_option = { strike: 770, bidPrice: 140.8, askPrice:150.8 };

      // $140.80	$150.80
      // $144.30	$152.70
      // bought_option = { strike:120, askPrice:10 };
      // sold_option = { strike: 100, bidPrice: 20 };
    }
    // If bought strike < sold strike then...
    var spread = optionSpread(bought_option, sold_option);
    var cost = optionCost(bought_option, sold_option);
    var roi = optionROI(spread, cost);
    return roi;
}

function optionROI(spread, cost){
  var roi = 0;
    if (spread > 0){
        // Vertical call.
        roi = (spread / cost) - 1; 
    } else if (spread < 0) {
        // Upside down vertical call.
        roi = cost / spread; 
    }
    return roi;
}

function outputChainToSpreadsheet(chain){

  // console.log(chain.optionQuotes[0]);

  var oqs = chain.optionQuotes.sort(compareByStrike);
  oqs.forEach( outputRowToSpreadsheet );
  
//  var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B5:C5");
//  range.setValues([ ["This is column B", "This is column C"] ]);

  return chain.optionQuotes.length;

}

function getTeslaOptions(){
  var result;
  // result = invokeQuestradeUrl('v1/symbols/38526/options');

  // result = JSON.parse(getOptionsQuote(38526));
  result = getOptionsQuote(38526);

  return outputChainToSpreadsheet(result);
}

function getStockLastPrice(ticker_symbol){
  var stock_quotes = JSON.parse( getMarketQuote(ticker_symbol) );
  /* {"quotes":[{"symbol":"TSLA","symbolId":38526,"tier":"","bidPrice":null,"bidSize":0,"askPrice":null,"askSize":0,"lastTradePriceTrHrs":846.35,"lastTradePrice":846.35,"lastTradeSize":0,"lastTradeTick":"…"
  */
  var stock_price = stock_quotes.quotes[0].lastTradePrice;
  return stock_price
}

function getOptionExpiryListFromStockSymbolId(symbolId){
  if (!symbolId){
    var params = getParameterCells()[0];
  
    // Get the Stock SymbolId from Stock symbol and save in f2.
    var stock_symbols = JSON.parse(getSymbol(params[0]));
    symbolId = '28768';  // NFLX.
  }
  var url = 'v1/symbols/' + symbolId + '/options';
  var result = invokeQuestradeUrl(url, null);
  console.log(result[0]);
  var expiryDates = parseExpiryDates(result);
  outputArrayToSpreadsheet(expiryDates, 2, 17);

  return expiryDates;
}

function parseExpiryDates(option_chain){
  var expiryDates = [];
  var chain = JSON.parse(option_chain);
  for (option in chain.optionChain){
    console.log("option: ", option, "---", "optionChain[option]: ", chain.optionChain[option]);
    expiryDates[option] = chain.optionChain[option].expiryDate;
  }
  console.log(expiryDates);
  return expiryDates;
}

function getSymbol(stock_ticker){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/symbols-search

  if (!stock_ticker)
    stock_ticker = 'NFLX';

  var url = 'v1/symbols/search?prefix=' + stock_ticker;
  var result = invokeQuestradeUrl(url, null);

  return result;
}

function getSymbolId(ticker_symbol){
  var stock_symbols = JSON.parse(getSymbol(ticker_symbol));
  // { symbols: [{symbol:"TSLA", symbolId:38526}, {symbol:TSLA.TO...}] }
  
  console.log(stock_symbols.symbols[0]);
  // Get stock_id from set of symbols.
  for (sym in stock_symbols.symbols) {
    console.log((sym));
    if(stock_symbols.symbols[sym].symbol == ticker_symbol){
      // Note: there can be duplicate symbols across different listingExchange's. E.g. UPST.
      stock_id = stock_symbols.symbols[sym].symbolId;
      break;
    }
  }
  return stock_id
}

function compareByStrike(a, b){
  if (parseFloat(a.strike) < parseFloat(b.strike)){
    return 1;
  }
  if (parseFloat(a.strike) > parseFloat(b.strike)){
    return -1;
  }
  return 0;
}

// Parses expiryDate and Strike price into fields on the returned object.
function parseSymbol(symbol, underlying){
  // https://developers.google.com/apps-script/reference/document/text#findText(String,RangeElement)

  //symbol = 'TSLA18Mar22C900.00';
  //underlying = 'TSLA';
  var indexOfC = symbol.indexOf('C',underlying.length + 1);
  var expiryDate = symbol.substring(underlying.length, indexOfC);
  var strike = symbol.substr(indexOfC + 1);
  var result = {};
  result.expiryDate = expiryDate;
  result.strike = parseInt(strike);
  return result;
}

function parseRow( oq, index ){
  var option = parseSymbol(oq.symbol,oq.underlying);
  oq.expiryDate = option.expiryDate;
  oq.strike = option.strike;
  console.log( '%s, %s, %s, %s, %s, %s', oq.symbol, oq.underlying, oq.symbolId, oq.bidPrice, oq.askPrice, oq.lastTradePrice, oq.lastTradeTime );
}

/*
    Spreadsheet functions
*/

function getNextLetter(_letter, _increments=1){
  var increments = parseInt(_increments);
  if (!_letter) _letter = 'f';
  var last_letter_code = _letter.length > 1 ? _letter.charCodeAt( _letter.length - 1) : _letter.charCodeAt(0);
  var offset = last_letter_code - 'a'.charCodeAt(0);
  var result = '';
  if (_letter.length > 1) {
    result = _letter.substring(0, _letter.length - 1);
  }
  result = result + String.fromCharCode(last_letter_code + increments);
  
  if (offset + increments >= 26){
    // Add a first letter and reset last letter to 'a'.
    result = 'a';
    result = result + 'a';
  }

  return result;
}

function getNextLetter_test(){
  console.log('should be d:', getNextLetter('c', 1));
  console.log('should be aa:', getNextLetter('c', 24));
  console.log('should be ab:', getNextLetter('aa', 1));
  console.log('should be cd:', getNextLetter('cc', 1));
}

function outputRowToSpreadsheet(oq, index){
  var row = index + 2;
  var s_range = Utilities.formatString('g%d:m%d', row, row);
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var range = sheet.getRange(s_range);
  range.setValues([ [ oq.symbol, oq.expiryDate, oq.strike, oq.bidPrice, oq.askPrice, oq.lastTradePrice, oq.lastTradeTime ] ]);
  
}

function outputArrayToSpreadsheet(array, row, column){
  // https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow,-column,-numrows
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getRange(row, column, array.length);
  // http://wafflebytes.blogspot.com/2016/10/google-script-create-drop-down-list.html
  // TBD.
  // range.setChoiceValues(array);
  var array_2d = new Array(array.length);
  array.forEach( (item, index) => { array_2d[index] = [item] } );

  range.setValues(array_2d);
}

function getParameterCells(cell_range = 'a2:f2'){
  var sheet = SpreadsheetApp.getActiveSheet();
  // Stock	Stock Price	  Expiry	  Min Strike  	Max Strike	  Stock SymbolId
  var range = sheet.getRange(cell_range);

  var values = range.getValues();

  console.log('[0][0]: %s', values[0][0]);
  return values;
}

// Set a value with optional formatting specified.
//  https://developers.google.com/sheets/api/guides/formats
const percentage_format = '###.0%';
const dollar_format = '$####.00'; 
const int_format = '#';
const two_decimals_format = '####.00';
function cellsSetValue(range, values, format){
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var range = sheet.getRange(range);
  range.setValues(values);
  if (format){
    range.setNumberFormat(format)
    if (format == int_format) {
      range.setFontWeight("bold");
    }
  }
}

function cellsClearRange(range){
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var range = sheet.getRange(range);
  range.clear();
}

/*
  Code to manipulate Spreadsheet:
  https://github.com/msembinelli/questrade-google-apps-script/blob/master/src/Code.ts
*/
