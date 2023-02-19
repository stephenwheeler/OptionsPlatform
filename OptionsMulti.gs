function getCondorParamsFromCells(cell_range = 'b3:b9') {
  var params = getParameterCells(cell_range);
  console.log(params)
  return params
}

function putOptionValueToCells(ticker_symbol = 'NFLX', cell_range = 'b24:b28'){
  // Put the stock symbol in b35
  stock_id = getSymbolId(ticker_symbol)
  stock_price = getStockLastPrice(stock_id)

  // Put the prices for the 4 calls and the stock into the spreadsheet
  // Iterate through getting the option prices
  
}

