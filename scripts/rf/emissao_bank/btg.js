const fs = require('fs');

const assetClass = 'rf';
const assetType = 'emissao_bank';
const brokerDealer = 'btg';

const inputDirPath = `${process.cwd()}/inputs/${assetClass}/${assetType}/${brokerDealer}`;

const inputDirFiles = fs.readdirSync(inputDirPath, 'utf-8');

const inputArrAllPages = inputDirFiles.map( fileName => {
  const filePath = `${inputDirPath}/${fileName}`;
  const inputStr = fs.readFileSync(filePath, 'utf-8');
  const inputObj = JSON.parse(inputStr);
  const inputArr = Array.from(inputObj);
  return inputArr;
}).flat(1);

const compareFn = (first, second) => {
  if (first.productID < second.productID) return -1;
  if (first.productID > second.productID) return 1;
  return 0;
};
const inputArrOrdered = inputArrAllPages.sort(compareFn);

const mapper = obj => {
  // const regexNumerico = /\d+(?:\.\d+)*(?:,\d+)?/g;
  // const aplicMinLoc = obj.aplicacaoMinima.match(regexNumerico)[0];
  // const rentabValueLoc = obj.rentabilidade.match(regexNumerico)[0];

  // const expDot = /\./g;
  // const expComma = /\,/g;
  const aplicMinStandard = obj.minAplicationValue.toLocaleString('pt-BR', { style: 'decimal' });
  // const rentabStandard = Number(rentabValueLoc.replace(expDot, '').replace(expComma, '.'));


  const ipcaCond = ob => ob.indexCaptureName.toLowerCase().includes('ipca');
  const cdiCond = ob => ob.indexCaptureName.toLowerCase().includes('cdi');
  const selicCond = ob => ob.indexCaptureName.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.indexCaptureName.toLowerCase().includes('pre');
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);
  // const liquidezVenc = o => o.typeLiquidityName.toLowerCase().includes('no vencimento');

  const rentabStandard = () => {
    if (
      prefixedCond(obj) ||
      (
        !prefixedCond(obj) &&
        obj.indexName.includes('+')
      )
    ) {
      return obj.taxValue;
    } else {
      return obj.percentIndexValue;
    }
  };
  
  const yieldPercent = parseFloat(
    (rentabStandard()/100)
    .toFixed(4)
  )
    .toLocaleString(
      'pt-BR',
      { style: 'decimal', minimumFractionDigits: 4 }
    );

  const parserPrazo = (date_1, date_2) => {
    const date1 = new Date(date_1);
    const date2 = new Date(date_2);
    const msd = 1000 * 60 * 60 * 24;
    const diffraw = date2 - date1;
    const diffdays = diffraw / msd;

    const nowDate = new Date();
    const maturityDate = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate() + diffdays,
    );
    return maturityDate.toLocaleDateString('pt-BR', {timeZone: 'America/Recife'});
  }
  
  return {
    distr: 'BTG',
    emissor: obj.issuerName,
    tipoPapel: obj.productName,
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.applicationDate, obj.applicationDeadline),
    ir: obj.incomeTaxFree ? 0 : 1,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: (postfixedYield(obj) && obj.indexName.includes('+')) ? '-' : yieldPercent,
    posIndexPlus: (postfixedYield(obj) && obj.indexName.includes('+')) ? yieldPercent : '-',
  };
};
const outputArr = inputArrOrdered.map(mapper);
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
