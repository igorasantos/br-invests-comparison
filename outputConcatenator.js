setTimeout(() => {
  require('child_process')
  .execSync('for f in ./outputs/rf/*.csv; do (cat "${f}"; echo) >> ./outputs/rf/all.csv; done')
  .toString('UTF-8');
  
  require('child_process')
  .execSync('for f in ./outputs/rf/emissao_bank/*.csv; do (cat "${f}"; echo) >> ./outputs/rf/all.csv; done')
  .toString('UTF-8');

  require('child_process')
  .execSync('for f in ./outputs/rf/cred_priv/*.csv; do (cat "${f}"; echo) >> ./outputs/rf/all.csv; done')
  .toString('UTF-8');
}, 1000);