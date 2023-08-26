const fs = require('fs');

const assetClass = 'rf';
const assetType = 'cred_priv';
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

const filterNotInvestidorQualificado = obj => obj.investmentType.toLowerCase().includes('nq') && !obj.investmentType.toLowerCase().includes('ql');

const inputArrFiltered = inputArrAllPages
  .filter(filterNotInvestidorQualificado);

const compareFn = (first, second) => {
  if (first.id < second.id) return -1;
  if (first.id > second.id) return 1;
  return 0;
};
const inputArrOrdered = inputArrFiltered.sort(compareFn);

const mapper = obj => {

  const aplicMinStandard = obj.minimumApplicationValue.toLocaleString('pt-BR', { style: 'decimal' });
  const rentabStandard = obj.percentIndexValue;

  const ipcaCond = ob => ob.indexCaptureName.toLowerCase().includes('ipca');
  const cdiCond = ob => ob.indexCaptureName.toLowerCase().includes('cdi');
  const selicCond = ob => ob.indexCaptureName.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.indexCaptureName ? ob.indexCaptureName.toLowerCase().includes('pre') : false;
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);

  const yieldPercent = parseFloat(
    (rentabStandard/100)
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

  const paperName = str => {
    const cra = str ? str.toLowerCase().includes('cra') : false;
    const cri = str ? str.toLowerCase().includes('cri') : false;
    const deb = !cra && !cri;
    return cra ? 'CRA' : cri ? 'CRI' : deb ? 'DEB' : 'verif';
  };

  return {
    distr: 'BTG',
    emissor: obj.issuerName,
    tipoPapel: paperName(obj.creditName),
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.applicationDate, obj.applicationDeadline),
    ir: obj.incomeTaxFree ? 0 : 1,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: (postfixedYield(obj) && obj.indexTaxDescription.includes('+')) ? '-' : yieldPercent,
    posIndexPlus: (postfixedYield(obj) && obj.indexTaxDescription.includes('+')) ? yieldPercent : '-',
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
