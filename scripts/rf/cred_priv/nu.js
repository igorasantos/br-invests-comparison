const fs = require('fs');

const assetClass = 'rf';
const assetType = 'cred_priv';
const brokerDealer = 'nu';

const inputDirPath = `${process.cwd()}/inputs/${assetClass}/${assetType}/${brokerDealer}`;

const inputDirFiles = fs.readdirSync(inputDirPath, 'utf-8');

const inputArrAllPages = inputDirFiles.map( fileName => {
  const filePath = `${inputDirPath}/${fileName}`;
  const inputStr = fs.readFileSync(filePath, 'utf-8');
  const inputObj = JSON.parse(inputStr);
  const inputArr = Array.from(inputObj.securities);
  return inputArr;
}).flat(1);

const filterNotInvestidorQualificado = obj => !obj.isQualified;

const inputArrFiltered = inputArrAllPages
  .filter(filterNotInvestidorQualificado);

const compareFn = (first, second) => {
  if (first.securityId < second.securityId) return -1;
  if (first.securityId > second.securityId) return 1;
  return 0;
};

const inputArrFilteredAndOrdered = inputArrFiltered.sort(compareFn);

const mapper = obj => {
  const regexNumerico = /\d+(?:\.\d+)*(?:,\d+)?/g;
  const rentabValueLoc = obj.rentability.match(regexNumerico)[0];

  const expDot = /\./g;
  const expComma = /\,/g;
  const aplicMinStandard = obj.minTick
    .toLocaleString(
      'pt-BR',
      { style: 'decimal' }
    );
  const rentabStandard = Number(rentabValueLoc.replace(expDot, '').replace(expComma, '.'));

  const ipcaCond = ob => ob.index.toLowerCase().includes('ipca');
  const cdiCond = ob => ob.index.toLowerCase().includes('cdi');
  const selicCond = ob => ob.index.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.index.toLowerCase().includes('prefixado');
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);
  const incomeTax = product => {
    let ir;
    switch (product) {
      case 'DEB':
      case 'CRI':
      case 'CRA':
      case 'LCI':
      case 'LCA':
      case 'LIG':
        ir = 0;
        break;
      case 'LC':
      case 'TD':
      case 'CDB':
        ir = 1;
        break;
      default:
        ir = 1;
        break;
    }
    return ir;
  }

  const yieldPercent = parseFloat(
    (rentabStandard/100)
    .toFixed(4)
  )
    .toLocaleString(
      'pt-BR',
      { style: 'decimal', minimumFractionDigits: 4 }
    );

  const parserPrazo = prazo => {
    const maturityDate = new Date(prazo);
    return maturityDate.toLocaleDateString('pt-BR', {timeZone: 'America/Recife'});
  }
  const irByIncomeTax = incomeTax(obj.securityType);
  const irByIncomeTaxFree = obj.incomeTaxFree ? 0 : 1;

  return {
    distr: 'Nu',
    emissor: obj.issuerName,
    tipoPapel: obj.securityNameType.substring(0,3),
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.maturity),
    ir: irByIncomeTax || irByIncomeTaxFree,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: obj.rentability.includes('+') ? '-' : yieldPercent,
    posIndexPlus: obj.rentability.includes('+') ? yieldPercent : '-',
  };
};
const outputArr = inputArrFilteredAndOrdered.map(mapper);
const csvStr = [
  ...outputArr.map(item => Object.values(item)),
]
  .map(e => e.join(';'))
  .join('\n');

const outputDir = `${process.cwd()}/outputs/${assetClass}/${assetType}`;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFile(
  `${outputDir}/${brokerDealer}.csv`,
  csvStr,
  err => {
    console.log(err || `${assetClass} / ${assetType} / ${brokerDealer} : Arquivo salvo!`);
  }
);
