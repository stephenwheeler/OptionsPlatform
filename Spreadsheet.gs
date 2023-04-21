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
