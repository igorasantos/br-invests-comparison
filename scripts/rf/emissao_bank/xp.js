const fs = require('fs');

const assetClass = 'rf';
const assetType = 'emissao_bank';
const brokerDealer = 'xp';

const inputDirPath = `${process.cwd()}/inputs/${assetClass}/${assetType}/${brokerDealer}`;

const inputDirFiles = fs.readdirSync(inputDirPath, 'utf-8');

const inputArrAllPages = inputDirFiles.map( fileName => {
  const filePath = `${inputDirPath}/${fileName}`;
  const inputStr = fs.readFileSync(filePath, 'utf-8');
  const inputObj = JSON.parse(inputStr);
  const inputArr = Array.from(inputObj.data);
  return inputArr;
}).flat(1);

const filterNotInvestidorQualificado = obj => obj.qualifiedInvestor !== "S";

const inputArrFiltered = inputArrAllPages
  .filter(filterNotInvestidorQualificado);

const compareFn = (first, second) => {
  if (first.code < second.code) return -1;
  if (first.code > second.code) return 1;
  return 0;
};

const inputArrFilteredAndOrdered = inputArrFiltered.sort(compareFn);

const mapper = obj => {
  const regexNumerico = /\d+(?:\.\d+)*(?:,\d+)?/g;
  // const aplicMinLoc = obj.aplicacaoMinima.match(regexNumerico)[0];
  const rentabValueLoc = obj.fee.match(regexNumerico)[0];

  const expDot = /\./g;
  const expComma = /\,/g;
  const aplicMinStandard = obj.puMinValue
    .toLocaleString(
      'pt-BR',
      { style: 'decimal' }
    );
  const rentabStandard = Number(rentabValueLoc.replace(expDot, '').replace(expComma, '.'));

  const ipcaCond = ob => ob.fee.toLowerCase().includes('ipc-a');
  const cdiCond = ob => ob.fee.toLowerCase().includes('cdi');
  const selicCond = ob => ob.fee.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.indexers.toLowerCase().includes('pré-fixado');
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);
  const liquidezVenc = o => o.redemptionType.toLowerCase().includes('no vencimento');
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

  return {
    distr: 'XP',
    emissor: obj.nickName,
    tipoPapel: obj.product,
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    liquidez: liquidezVenc(obj) ? 'vcto' : 'amortizado',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.maturityDate),
    payJuros: obj.descriptionInterestrates,
    amort: obj.descriptionAmortization,
    ir: incomeTax(obj.product),
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: obj.fee.includes('% ') ? yieldPercent : '-',
    posIndexPlus: obj.fee.includes('+') ? yieldPercent : '-',
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
