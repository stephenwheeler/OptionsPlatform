function getSymbol(stock_ticker){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/symbols-search

  if (!stock_ticker)
    stock_ticker = 'NFLX';

  var url = 'v1/symbols/search?prefix=' + stock_ticker;
  var result = invokeQuestradeUrl(url, null);

  return result;
}

function getMarketQuote(symbolId){
  // https://www.questrade.com/api/documentation/rest-operations/market-calls/markets-quotes-id

  if (!symbolId)
    stock_ticker = 'NFLX';

  var url = 'v1/markets/quotes/' + symbolId;
  var result = invokeQuestradeUrl(url, null);

  return result;
}

function get_new_tokens(){
    // Get tokens using a Questrade IQ Apps token.
    //  Questrade top right --> Settings --> IQ API --> Edit
    //    My Applications --> Manage
    //    Register your application
    //    Add a new device
    //    Generate a token, copy it, and paste into one_time_token below. 
    // https://www.questrade.com/api/documentation/getting-started 

    var url = "https://login.questrade.com/oauth2/token?grant_type=refresh_token&refresh_token=";
    var one_time_token = "REPLACE_WITH_ONE_TIME_TOKEN";
    var full_url = url + one_time_token; // Tokens from Questrade only work once...
    var response = UrlFetchApp.fetch(full_url, { "muteHttpExceptions": true});
    var content_text = response.getContentText()
    // Must save escaped response for JSON parse to succeed for saved_tokens.
    var userProperties = PropertiesService.getUserProperties();

    userProperties.setProperty("saved_tokens", content_text);

    return content_text;
}

function get_tokens(){
  var userProperties = PropertiesService.getUserProperties();
  var saved_tokens = userProperties.getProperty("saved_tokens");
  var json;
  if (!saved_tokens){

    var content_text;
    content_text = get_new_tokens();

    json = content_text;
  } else {
    json = saved_tokens;
  }

  return JSON.parse(json);
}

function invokeQuestradeUrl(path, data_opt)
{
  var tokens = get_tokens();

  var api_host = tokens.api_server; 
  api_host = api_host ? api_host : 'https://api01.iq.questrade.com';
  path = path ? path : 'v1/accounts';
  var full_url = api_host + path;
  
  return invokeUrl(full_url, tokens, null, null, data_opt )

  // return accessProtectedResource(full_url, null, null, data_opt);
}

function invokeUrl(url, tokens, method_opt, headers_opt, payload_opt) {

    // Make the UrlFetch request and return the result.
    var method = method_opt || payload_opt ? 'post' : 'get';
    var headers = headers_opt || {};
    headers['Authorization'] =
        Utilities.formatString('Bearer %s', tokens.access_token);
    // headers['Content-Type'] = 'application/json';
    // headers['Accept'] = 'application/json';
    var options = {
      'headers': headers,
      'method' : method,
      'muteHttpExceptions': true, // Prevents thrown HTTP exceptions.
    };
    if (payload_opt) {
      options.payload = payload_opt;
    }
    var resp = UrlFetchApp.fetch(url, options);

    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) {
      return resp.getContentText("utf-8"); // Success
    } else if (code == 401 || code == 403) {
       // Not fully authorized for this action.
       
       console.error("Backend server error (%s): %s", code.toString(),
                     resp.getContentText("utf-8"));
       // service.refresh(); // try to refresh the access token.
       throw ("Backend server error: " + code);

    } else {
       // Handle other response codes by logging them and throwing an
       // exception.
       console.error("Backend server error (%s): %s", code.toString(),
                     resp.getContentText("utf-8"));
       throw ("Backend server error: " + code);
    }
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
