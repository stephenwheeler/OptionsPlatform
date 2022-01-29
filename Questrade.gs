function getMarketQuote(symbolId){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/markets-quotes-id

  if (!symbolId)
    stock_ticker = 'NFLX';

  var url = 'v1/markets/quotes/' + symbolId;
  var result = invokeQuestradeUrl(url, null);

  return result;
}