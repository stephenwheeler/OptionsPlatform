function getStockQuote(ticker_symbol){
  return getStockLastPrice( getSymbolId(ticker_symbol) );
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

function getStockLastPrice(ticker_symbol){
  var stock_quotes = JSON.parse( getMarketQuote(ticker_symbol) );
  /* {"quotes":[{"symbol":"TSLA","symbolId":38526,"tier":"","bidPrice":null,"bidSize":0,"askPrice":null,"askSize":0,"lastTradePriceTrHrs":846.35,"lastTradePrice":846.35,"lastTradeSize":0,"lastTradeTick":"…"
  */
  var stock_price = stock_quotes.quotes[0].lastTradePrice;
  return stock_price
}

/*
  Get a column of stock symbols based on a count value in cell a2.
  Get a stock quote for each symbol.
  Write the stock prices into column d, starting at d3.
*/
function doStockQuotesColumn(){
  // Get Range of stock ticker symbols
  var num_stocks = getParameterCells('a2')[0][0];
  var i_num_stocks = parseInt(num_stocks);
  if (isNaN(i_num_stocks)){
    console.error("Column item count is not a number - are you on the right sheet?")
    return
  }
  var stock_range_string = 'a3:a' + (parseInt(num_stocks) + 2);
  var stock_price_range_string = 'd3:d' + (parseInt(num_stocks) + 2);
  var stock_range = getParameterCells( stock_range_string );

  var stock_prices = [[]];

  // Iterate the stock ticker symbols and save prices
  for (stock in stock_range){
    stock_prices[stock] = [getStockQuote(stock_range[stock])];
  }

  // Update prices in spreadsheet, starting at D3. Not quite working...TODO.
  cellsSetValue(stock_price_range_string, stock_prices, dollar_format);

}