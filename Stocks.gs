

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