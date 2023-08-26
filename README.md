# Brazilian investiment comparison
This repo aim to be a tool for personal comparisons on the brazilian investment market and help you to do a better investment decision.

# How to use
Usually, the fixed income bonds/securities are updated every working day by the broker dealers.
So, always when you want to check this market:

1. Go to your broker dealer(s) site(s)
2. Get the bonds/securities endpoint response
- Maybe it will be available only on logged area
  - if this is the case, as they use query with authentication, require manual step.
  - this would be solved with rpa, but I chose not do it.
- If they display the bond/security at the public area, better
  - may be requested smoothly by script (but the code here doesn't cover this scenario)
- Just:
  - browse to the site section
  - open the browser network inspector
  - locate the request made to get the bonds/securities
  - copy the response
  - paste on directory: `inputs/rf/<assetType>/<brokerDealer>`
    - if there are only one page, paste it as `01.json`
  - if there are more, paste it as separate files (beginning at `01.json`)
3. Run the script
- On the repo root: `node index`
4. Take the output file compiled
- open the `all.csv` file
- copy its content
- go to your spreadsheet
- paste it
- make your analysis

# How to compare
Due to personal preferences in analysis mode, I won't cover this in the script coded here, but to share how I'm using:
- calculate the net interest rate, considering
  - the brazilian income tax
  - brazilian indexes estimates
- convert the interest rate at the period to an yearly basis (i.e., find the *Annual Percentage Rate - APR*)
- if it's important to you, take into account other variables, like:
  - liquidity
  - minimum investment amount
  - investment maturity date
  - and so on

# Mapped broker dealers
- XP
- Nu
- BTG

# Files - inputs directory
```sh
.
└── inputs
    └── rf
        ├── cred_priv
        │   ├── btg
        │   │   ├── cra_cri.json
        │   │   └── deb.json
        │   ├── nu
        │   │   ├── cri_cra.json
        │   │   └── deb.json
        │   └── xp
        │       └── 01.json
        └── emissao_bank
            ├── btg
            │   └── cdb_lca_lci_lf_lc.json
            ├── nu
            │   ├── cdb_lc.json
            │   └── lci_lca.json
            └── xp
                └── 01.json
```

# Disclaimer
- Broker dealers administration fees are not covered here.

- Broker dealers transaction fees are not covered here.

- Other brazilian taxes to specific scenarios are not covered here (like the one related with financial operations, when you withdraw investment with less than 30 days).

- This repo and it's code aren't any kind of investment advice or any preference with some broker dealer.

- All the use is only for personal purpose.

- To invest directly on brazilian bonds/securities you must be elegible. Some infos about it:
  - *in pt-BR*:
    - [B3](https://www.b3.com.br/pt_br/regulacao/investimento-estrangeiro/)
    - CVM (Securities and Exchange Commission of Brazil) articles:
      - [Foreign investors](https://www.gov.br/investidor/pt-br/investir/como-investir/investidor-estrangeiro)
      - [Not-resident Investors](https://www.gov.br/cvm/pt-br/assuntos/regulados/consultas-por-participante/investidores-nao-residentes)
    - [Article on a blog related with investments](https://mepoupe.com/dicas-de-riqueza/como-investir-no-brasil-morando-no-exterior/)
  - *in en-US*:
    - [B3](https://www.b3.com.br/en_us/regulation/non-resident-investor/)
    - CVM (Securities and Exchange Commission of Brazil):
      - [Foreign Investors section](https://www.gov.br/cvm/en/foreign-investors)