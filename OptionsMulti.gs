var do_condor_row_range = 'b20:z20'
var condor_stock_price_row = 23
var condor_first_row = 3
var condor_last_row = 25

function getCondorParamsFromCells(cell_range = 'b3:b21') {
  var params = getParameterCells(cell_range);
  var result = {}
  result.ticker_symbol = params[0][0]
  result.expiry = params[1][0]
  result.above_top_strike = params[condor_last_row - condor_first_row - 4][0]
  result.above_lower_strike = params[condor_last_row - condor_first_row - 3][0]
  result.below_top_strike = params[condor_last_row - condor_first_row - 1][0]
  result.below_lower_strike = params[condor_last_row - condor_first_row][0]
  console.log(result)
  return result
}

function doCondorOptions(){
  // Check which columns to process
  var columns = getParameterCells(do_condor_row_range)[0]
  var column_letter = 'b'
  for (col in columns){
    var condor_range = column_letter + condor_first_row + ':' + column_letter + condor_last_row
    if (columns[col].length > 0){
      console.log(columns[col])
      if (columns[col].toLowerCase() == 'x'){
        doCondorOptionsSingle(condor_range, column_letter)
      }
    }
    column_letter = getNextLetter(column_letter) 
  }
}

function doCondorOptionsSingle(range, column_letter) 
{
  params = getCondorParamsFromCells(range)
  option_values = getOptionsValues(params.ticker_symbol, params.expiry, params.above_top_strike,
      params.above_lower_strike, params.below_top_strike, params.below_lower_strike)

  // Put the prices for the 4 calls and the stock into the spreadsheet
  putCondorOptionValuesInCells(params, option_values, column_letter)
}

function putCondorOptionValuesInCells(params, option_values, column_letter){
  var result = {}
  // Iterate through getting the option prices
  option_values.optionQuotes.forEach(function(option, index){
    if (option.strike == params.above_top_strike){
      result.above_bought = option
    }
    if (option.strike == params.above_lower_strike){
      result.above_sold = option
    }
    if (option.strike == params.below_top_strike){
      result.below_sold = option
    }
    if (option.strike == params.below_lower_strike){
      result.below_bought = option
    }
  });
  
  cellsSetValue(column_letter + condor_stock_price_row, [[option_values.stock_price]], dollar_format)
  // Note: we can have cases where no options are available. The spread and cost will be set to zero.
  var above_spread = 0
  var below_spread = 0
  var above_cost = 0
  var below_cost = 0
  if ( option_values.optionQuotes.length > 0){
    // Note: we can have cases where one or multiple options are not available. In this case the spread and cost will be set to zero.
    above_spread = optionSpread(result.above_bought, result.above_sold)
    below_spread = optionSpread(result.below_bought, result.below_sold)
    above_cost = optionCost(result.above_bought, result.above_sold)
    below_cost = optionCost(result.below_bought, result.below_sold)
  }
  cellsSetValue(column_letter + (condor_stock_price_row+5), [[above_spread]], dollar_format);
  cellsSetValue(column_letter + (condor_stock_price_row+7), [[below_spread]], dollar_format);
  cellsSetValue(column_letter + (condor_stock_price_row+6), [[above_cost]], dollar_format);
  cellsSetValue(column_letter + (condor_stock_price_row+8), [[below_cost]], dollar_format);
}

function getOptionsValues(ticker_symbol = 'NFLX', expiry, above_top_strike, above_lower_strike,
      below_top_strike, below_lower_strike){

  // Put the stock symbol in b35
  stock_id = getSymbolId(ticker_symbol)
  console.log(stock_id)
  stock_price = getStockLastPrice(stock_id)
  console.log(stock_price)

  option_quotes = getOptionsQuoteParams(stock_id, expiry, below_lower_strike, above_top_strike)
  option_quotes.stock_price = stock_price

  return option_quotes
}

function getOptionsValues_test(){
  getOptionsValues('NFLX', "2023-04-21T00:00:00.000000-05:00", 420, 390, 320, 290)
}