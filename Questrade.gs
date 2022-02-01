function getMarketQuote(symbolId){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/markets-quotes-id

  if (!symbolId)
    stock_ticker = 'NFLX';

  var url = 'v1/markets/quotes/' + symbolId;
  var result = invokeQuestradeUrl(url, null);

  return result;
}

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
