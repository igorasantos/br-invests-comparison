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
// const filterNotInvestidorProfissional = obj => obj.investidorProfissional === false;

const inputArrFiltered = inputArrAllPages
  .filter(filterNotInvestidorQualificado);
  // .filter(filterNotInvestidorProfissional);

const compareFn = (first, second) => {
  if (first.id < second.id) return -1;
  if (first.id > second.id) return 1;
  return 0;
};
const inputArrOrdered = inputArrFiltered.sort(compareFn);

const mapper = obj => {
  // const regexNumerico = /\d+(?:\.\d+)*(?:,\d+)?/g;
  // const aplicMinLoc = obj.aplicacaoMinima.match(regexNumerico)[0];
  // const rentabValueLoc = obj.rentabilidade.match(regexNumerico)[0];

  // const expDot = /\./g;
  // const expComma = /\,/g;
  const aplicMinStandard = obj.minimumApplicationValue.toLocaleString('pt-BR', { style: 'decimal' });
  // const rentabStandard = Number(rentabValueLoc.replace(expDot, '').replace(expComma, '.'));
  const rentabStandard = obj.percentIndexValue;

  const ipcaCond = ob => ob.indexCaptureName.toLowerCase().includes('ipca');
  const cdiCond = ob => ob.indexCaptureName.toLowerCase().includes('cdi');
  const selicCond = ob => ob.indexCaptureName.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.taxaCaptacaoName ? ob.taxaCaptacaoName.toLowerCase().includes('pre_fixada') : false;
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);
  // const liquidezVenc = o => o.typeLiquidityName.toLowerCase().includes('no vencimento');
  const liquidezVenc = 'vcto';

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
    return cra ? cra : cri ? cri : deb ? deb : 'verif';
  };

  const parserTypeDeadline = str => {
    const mensal = str.toLowerCase().includes('mensal') ? true : false;
    const meses = str.toLowerCase().includes('meses') ? true : false;
    const semestral = str.toLowerCase().includes('semestral') ? true : false;
    const anual = str.toLowerCase().includes('anual') ? true : false;
    const vencimento = str.toLowerCase().includes('vencimento') ? true : false;
    return mensal ? mensal : meses ? meses : semestral ? semestral : anual ? anual : vencimento ? vencimento : 'verif';
  };

  return {
    distr: 'BTG',
    emissor: obj.issuerName,
    tipoPapel: paperName(obj.creditName),
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    liquidez: liquidezVenc === 'vcto' ? 'vcto' : '?',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.applicationDate, obj.applicationDeadline),
    payJuros: parserTypeDeadline(obj.tipoJuros),
    amort: parserTypeDeadline(obj.tipoAmortizacao),
    ir: obj.incomeTaxFree ? 1 : 0,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: obj.percentIndexValue.includes('% do ') ? yieldPercent : '-',
    posIndexPlus: obj.percentIndexValue.includes('+') ? yieldPercent : '-',
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
