# Brazilian investiment comparison
This repo aim to be a tool for personal comparisons on the whole brazilian investment market (or at least where you have account) and help you to do a better decision.

# How to use
Usually, the fixed income bonds are updated every working day at the broker dealers.
So, always when you want to check this market:

1. Go to your broker dealer(s) site(s)
2. Get the bonds endpoint response
- Maybe it will be available only in logged area
  - if this is the case, as they use query with auth, require manual step
- If they display the bond at the public area, better
  - may be requested smoothly by script (_maybe_ this step will be coded)
- Just:
 - browse to the site section
 - open the network inspector
 - locate the request made to get the bonds
 - copy the response
 - paste on directory: `inputs/rf/<assetType>/<brokerDealer>`
   - if there are only one page, paste it as `01.json`
   - if there are more, paste it as separate files (beginning at `01.json`)
1. Run the script
- On the repo root: `node ./index.js`
4. Take the output file concatenated
- open the `all.csv` file
- copy its content
- go to your spreadsheet
- paste it
- do your analysis

# How to compare
Due to personal preferences in analysis mode, I won't cover this in the script coded here, but to share how I'm thinking to do in my personal use:
- calculate the net interest rate, considering
  - the brazilian income tax
  - brazilian indexes estimates
- compare all the options in a yearly equivalent
- take into account other variables, like:
  - liquidity
  - minimum investment amount
  - investment maturity date
  - etc

# Supported broker dealers
- Vitreo
- XP
- Nu
- BTG (todo)
- Inter (todo)
- TD: not supported (do it manually)

`wip`

# Disclaimer
This repo and it's code isn't any kind of investment advice or any preference by some broker dealer.

All the use is only for personal purpose.