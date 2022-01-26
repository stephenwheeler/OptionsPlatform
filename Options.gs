/**
 * Attempts to access a non-Google API using a constructed service
 * object.
 *
 * If your add-on needs access to non-Google APIs that require OAuth,
 * you need to implement this method. You can use the OAuth1 and
 * OAuth2 Apps Script libraries to help implement it.
 *
 * @param {String} url         The URL to access.
 * @param {String} method_opt  The HTTP method. Defaults to GET.
 * @param {Object} headers_opt The HTTP headers. Defaults to an empty
 *                             object. The Authorization field is added
 *                             to the headers in this method.
 * @return {HttpResponse} the result from the UrlFetchApp.fetch() call.
 */
function accessProtectedResource(url, method_opt, headers_opt, payload_opt) {
  var service = getOAuthService();
  var maybeAuthorized = service.hasAccess();

  if (maybeAuthorized) {
    // A token is present, but it may be expired or invalid. Make a
    // request and check the response code to be sure.
    var currentAccessToken = service.getAccessToken();
    if (service.isExpired_(currentAccessToken)){
      service.refresh();
    }
    var accessToken = service.getAccessToken();
    if (service.isExpired_(accessToken)){
      console.error("Failed to refresh access token: %s", service.isExpired_(accessToken));
    }
    // Make the UrlFetch request and return the result.
    var method = method_opt || payload_opt ? 'post' : 'get';
    var headers = headers_opt || {};
    headers['Authorization'] =
        Utilities.formatString('Bearer %s', accessToken);
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
       maybeAuthorized = false;
       console.error("Backend server error (%s): %s", code.toString(),
                     resp.getContentText("utf-8"));
       service.refresh(); // try to refresh the access token.
       throw ("Backend server error: " + code);

    } else {
       // Handle other response codes by logging them and throwing an
       // exception.
       console.error("Backend server error (%s): %s", code.toString(),
                     resp.getContentText("utf-8"));
       throw ("Backend server error: " + code);
    }
  }

  if (!maybeAuthorized) {
    // Invoke the authorization flow using the default authorization
    // prompt card.
    CardService.newAuthorizationException()
        .setAuthorizationUrl(service.getAuthorizationUrl())
        .setResourceDisplayName("Authorize access to Options Q app")
        .throwException();
  }
}


/**
 * Create a new OAuth service to facilitate accessing an API.
 * This example assumes there is a single service that the add-on needs to
 * access. Its name is used when persisting the authorized token, so ensure
 * it is unique within the scope of the property store. You must set the
 * client secret and client ID, which are obtained when registering your
 * add-on with the API.
 *
 * See the Apps Script OAuth2 Library documentation for more
 * information:
 *   https://github.com/googlesamples/apps-script-oauth2#1-create-the-oauth2-service
 *
 *  @return A configured OAuth2 service object.
 */
function getOAuthService_template() {
  return OAuth2.createService('SERVICE_NAME')
      .setAuthorizationBaseUrl('SERVICE_AUTH_URL')
      .setTokenUrl('SERVICE_AUTH_TOKEN_URL')
      .setClientId('CLIENT_ID')
      .setClientSecret('CLIENT_SECRET')
      .setScope('SERVICE_SCOPE_REQUESTS')
      .setCallbackFunction('authCallback')
      .setCache(CacheService.getUserCache())
      .setPropertyStore(PropertiesService.getUserProperties());
}

function getOAuthService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  // From here: https://github.com/googleworkspace/apps-script-oauth2
  return OAuth2.createService('OptionsQapp')

      // Set the endpoint URLs, which are the same for all Google services.
      // From here: https://www.questrade.com/api/documentation/authorization
      // https://login.questrade.com/oauth2/authorize?client_id=<client_id> &response_type=code&redirect_uri=https://www.example.com

      .setAuthorizationBaseUrl('https://login.questrade.com/oauth2/authorize')
      // .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      
      .setTokenUrl('https://login.questrade.com/oauth2/token')
      // .setTokenUrl('https://accounts.google.com/o/oauth2/token')
      // https://login.questrade.com/oauth2/token?client_id=<client id=""> &code=<code>&grant_type=authorization_code&redirect_uri=http://www.example.com

      .setRefreshUrl('https://login.questrade.com/oauth2/token')

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId('_wlnCeyvCQArXge6tqoHOrm_hChKdg')
      .setClientSecret('...')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      .setCache(CacheService.getUserCache())

      // Set the scopes to request (space-separated for Google services).
      // .setScope('https://www.googleapis.com/auth/drive')

      // Below are Google-specific OAuth2 parameters.

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      // .setParam('login_hint', Session.getEffectiveUser().getEmail())

      // Requests offline access.
      // .setParam('access_type', 'offline')

      // Consent prompt is required to ensure a refresh token is always
      // returned when requesting offline access.
      // .setParam('prompt', 'consent');
}

// From here: https://github.com/googleworkspace/apps-script-oauth2#2-direct-the-user-to-the-authorization-url
function showSidebar() {
  var driveService = getOAuthService();
  if (!driveService.hasAccess()) {
    var authorizationUrl = driveService.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    SpreadsheetApp.getUi().showSidebar(page);
  } else {
  // ...
  }
}


/**
 * Boilerplate code to determine if a request is authorized and returns
 * a corresponding HTML message. When the user completes the OAuth2 flow
 * on the service provider's website, this function is invoked from the
 * service. In order for authorization to succeed you must make sure that
 * the service knows how to call this function by setting the correct
 * redirect URL.
 *
 * The redirect URL to enter is:
 * https://script.google.com/macros/d/<Apps Script ID>/usercallback
 *
 * See the Apps Script OAuth2 Library documentation for more
 * information:
 *   https://github.com/googlesamples/apps-script-oauth2#1-create-the-oauth2-service
 *
 *  @param {Object} callbackRequest The request data received from the
 *                  callback function. Pass it to the service's
 *                  handleCallback() method to complete the
 *                  authorization process.
 *  @return {HtmlOutput} a success or denied HTML message to display to
 *          the user. Also sets a timer to close the window
 *          automatically.
 */
function authCallback(callbackRequest) {
  var authorized = getOAuthService().handleCallback(callbackRequest);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<p>Success!</p> <p>' + JSON.stringify(callbackRequest) + '</p> <script>setTimeout(function() { top.window.close() }, 1);</script>');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}

/**
 * Unauthorizes the non-Google service. This is useful for OAuth
 * development/testing.  Run this method (Run > resetOAuth in the script
 * editor) to reset OAuth to re-prompt the user for OAuth.
 */
function resetOAuth() {
  getOAuthService().reset();
}