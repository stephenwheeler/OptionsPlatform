function invokeQuestradeUrl(path, data_opt)
{
  var service = getOAuthService();
  var token = service.getToken();
  
  var api_host = token.api_server; 
  api_host = api_host ? api_host : 'https://api01.iq.questrade.com';
  path = path ? path : 'v1/accounts';
  var full_url = api_host + path;
  return accessProtectedResource(full_url, null, null, data_opt);
}

function getOptionsQuoteVertical(stock_id, expiry){
  stock_id = 38526;
  var payload = {
    variants: [
        {
             variantId: 1,
             strategy: 'VerticalCallSpread',
             legs: [
                   {
                      symbolId: 28908433,
                      ratio:  10,
                      action: 'Buy'
                   },
                   {
                       symbolId: 32072800,
                       ratio:  10,
                       action: 'Sell'
                   }
                ]
          }
    ]
  };
  return invokeQuestradeUrl('v1/markets/quotes/strategies', JSON.stringify(payload));
}

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

function getOptionsQuoteParams(stock_id, expiry, min_strike, max_strike){
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
  return invokeQuestradeUrl('v1/markets/quotes/options', JSON.stringify(payload));
}

function getOptionsChainFromCells(){
  var params = getParameterCells()[0];
  var stock_id = null;
  
  // Get the Stock SymbolId from Stock symbol and save in f2.
  var stock_symbols = JSON.parse(getSymbol(params[0]));
  // { symbols: [{symbol:"TSLA", symbolId:38526}, {symbol:TSLA.TO...}] }
  
  console.log(stock_symbols.symbols[0]);
  // Get stock_id from set of symbols.
  for (sym in stock_symbols.symbols) {
    console.log((sym));
    if(stock_symbols.symbols[sym].symbol == params[0]){
      stock_id = stock_symbols.symbols[sym].symbolId;
    }
  }
  console.log(stock_id);
  var cell_values = [[ stock_id ]];
  cellsSetValue('f2', cell_values); // Persist stock_id to spreadsheet.
  
  // Get Option quotes for all options between min/max strike prices.
  var s_result = getOptionsQuoteParams(stock_id,params[2], params[3], params[4]);

  var result = JSON.parse(s_result);

  result.optionQuotes.forEach ( parseRow );

  var num_options = outputChainToSpreadsheet(result);

  var output = outputMatrixValuesToSpreadsheet(result, calculateVerticalCallROI, 11, 'c');

  return result.optionQuotes.length;
}

function outputMatrixValuesToSpreadsheet( chain, matrix_values_function, row_offset, column ){
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
                cellsSetValue( _range, [[a_options[sold].strike]] );
            } else if (sold == 0) {
                // Output left column of strike prices.
                console.log(bought, ',', sold, a_options[bought].strike);
                cellsSetValue( _range, [[a_options[bought].strike]] );
            } else {
                result = matrix_values_function(a_options[bought], a_options[sold]);
                console.log(bought, ',', sold, result);
                cellsSetValue( _range, [[result]] );
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
function calculateVerticalCallROI(bought_option, sold_option){
    if (!bought_option){
      bought_option = { strike:770, askPrice:203 };
      sold_option = { strike: 820, bidPrice: 176.15 };
      // bought_option = { strike:120, askPrice:10 };
      // sold_option = { strike: 100, bidPrice: 20 };
    }
    // If bought strike < sold strike then...
    var spread = sold_option.strike - bought_option.strike;
    var cost = 0;
    if (bought_option.askPrice && sold_option.bidPrice){
      cost = bought_option.askPrice - sold_option.bidPrice;
    } else {
      // Bid and Ask only available when the market is open.
      cost = bought_option.lastTradePrice - sold_option.lastTradePrice;
    }
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
  // var result = JSON.parse(chain);

  // result.optionQuotes.forEach ( parseRow );

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

function getOptionsFromStockSymbolId(symbolId){
  if (!symbolId)
    symbolId = '28768';  // NFLX.
  
  var url = 'v1/symbols/' + symbolId + '/options';
  var result = invokeQuestradeUrl(url, null);
  console.log(result);
  return result;
}

function getSymbol(stock_ticker){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/symbols-search

  if (!stock_ticker)
    stock_ticker = 'NFLX';

  var url = 'v1/symbols/search?prefix=' + stock_ticker;
  var result = invokeQuestradeUrl(url, null);

  return result;
}

function compareByStrike(a, b){
  if (parseInt(a.strike) < parseInt(b.strike)){
    return 1;
  }
  if (parseInt(a.strike) > parseInt(b.strike)){
    return -1;
  }
  return 0;
}


function parseSymbol(symbol, underlying){
  // https://developers.google.com/apps-script/reference/document/text#findText(String,RangeElement)

  //symbol = 'TSLA18Mar22C900.00';
  //underlying = 'TSLA';
  var indexOfC = symbol.indexOf('C',underlying.length + 1);
  var expiryDate = symbol.substring(underlying.length, indexOfC);
  var strike = symbol.substr(indexOfC + 1);
  var result = {};
  result.expiryDate = expiryDate;
  result.strike = strike;
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
  if (!_letter) _letter = 'f';
  var result = String.fromCharCode(_letter.charCodeAt(0) + parseInt(_increments));
  console.log('result: ', result);
  return result;
}

function outputRowToSpreadsheet(oq, index){
  var row = index + 2;
  var s_range = Utilities.formatString('g%d:m%d', row, row);
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var range = sheet.getRange(s_range);
  range.setValues([ [ oq.symbol, oq.expiryDate, oq.strike, oq.bidPrice, oq.askPrice, oq.lastTradePrice, oq.lastTradeTime ] ]);
  
}

function getParameterCells(){
  var sheet = SpreadsheetApp.getActiveSheet();
  // Stock	Stock Price	  Expiry	  Min Strike  	Max Strike	  Stock SymbolId
  var range = sheet.getRange('a2:f2');

  var values = range.getValues();

  console.log('[0][0]: %s', values[0][0]);
  return values;
}

function cellsSetValue(range, values){
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var range = sheet.getRange(range);
  range.setValues(values);
}

/*
  Code to manipulate Spreadsheet:
  https://github.com/msembinelli/questrade-google-apps-script/blob/master/src/Code.ts
*/
