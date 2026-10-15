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



const TOKEN_PROPERTY = "saved_tokens";
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000; // Refresh 1 minute early

function initialize_questrade_tokens() {
  const tokens = get_new_tokens("j2BY0YlgzVGn7rSycORqOYqBkQunTmk_0");
  Logger.log("Token expiry: " + new Date(tokens.expires_at));
}

/**
 * Returns valid tokens, refreshing automatically when necessary.
 */
function get_tokens() {
  const userProperties = PropertiesService.getUserProperties();
  const savedText = userProperties.getProperty(TOKEN_PROPERTY);

  let tokens = savedText ? JSON.parse(savedText) : null;

  // Missing tokens, missing expiry metadata, or expiry approaching:
  // obtain a fresh access token.
  if (
    !tokens ||
    !tokens.access_token ||
    !tokens.refresh_token ||
    !tokens.expires_at ||
    Date.now() >= tokens.expires_at - TOKEN_EXPIRY_MARGIN_MS
  ) {
    tokens = get_new_tokens();
  }

  return tokens;
}

/**
 * Refreshes the Questrade access token and saves the new token set.
 *
 * For initial setup, supply your one-time token as the argument.
 * Subsequent calls use the saved refresh token automatically.
 */
function get_new_tokens(initialRefreshToken) {
  const userProperties = PropertiesService.getUserProperties();
  const savedText = userProperties.getProperty(TOKEN_PROPERTY);
  const savedTokens = savedText ? JSON.parse(savedText) : null;

  const refreshToken =
    initialRefreshToken || (savedTokens && savedTokens.refresh_token);

  if (!refreshToken) {
    throw new Error(
      "No refresh token is saved. Call get_new_tokens() with your " +
      "initial Questrade token to initialize authentication."
    );
  }

  const url =
    "https://login.questrade.com/oauth2/token" +
    "?grant_type=refresh_token" +
    "&refresh_token=" + encodeURIComponent(refreshToken);

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const contentText = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error(
      "Questrade token refresh failed. HTTP " +
      status + ": " + contentText
    );
  }

  let newTokens;

  try {
    newTokens = JSON.parse(contentText);
  } catch (e) {
    throw new Error("Questrade returned invalid token JSON: " + contentText);
  }

  if (
    !newTokens.access_token ||
    !newTokens.refresh_token ||
    !newTokens.expires_in
  ) {
    throw new Error(
      "Questrade token response is missing required fields: " +
      contentText
    );
  }

  // Store the absolute expiry time, in milliseconds since the Unix epoch.
  newTokens.expires_at =
    Date.now() + Number(newTokens.expires_in) * 1000;

  // Save only after the response has been validated.
  userProperties.setProperty(
    TOKEN_PROPERTY,
    JSON.stringify(newTokens)
  );

  return newTokens;
}

/**
 * Optional test function.
 */
function get_new_tokens_test() {
  return get_tokens();
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
