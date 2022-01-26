const fs = require('fs');

const assetClass = 'rf';
const assetType = 'emissao_bank';
const brokerDealer = 'vitreo';

const inputDirPath = `${process.cwd()}/inputs/${assetClass}/${assetType}/${brokerDealer}`;

const inputDirFiles = fs.readdirSync(inputDirPath, 'utf-8');

const inputArrAllPages = inputDirFiles.map( fileName => {
  const filePath = `${inputDirPath}/${fileName}`;
  const inputStr = fs.readFileSync(filePath, 'utf-8');
  const inputObj = JSON.parse(inputStr);
  const inputArr = Array.from(inputObj.resultados);
  return inputArr;
}).flat(1);

const inputFilePathEmissores = `${process.cwd()}/inputs/${assetClass}/${assetType}/emissores_${brokerDealer}.json`;
const inputStrEmissores = fs.readFileSync(inputFilePathEmissores, 'utf-8');
const inputObjEmissores = JSON.parse(inputStrEmissores);
const inputArrEmissores = Array.from(inputObjEmissores);

const compareFn = (first, second) => {
  if (first.id < second.id) return -1;
  if (first.id > second.id) return 1;
  return 0;
};
const inputArrOrdered = inputArrAllPages.sort(compareFn);

const mapper = obj => {
  const regexNumerico = /\d+(?:\.\d+)*(?:,\d+)?/g;
  // const aplicMinLoc = obj.aplicacaoMinima.match(regexNumerico)[0];
  const rentabValueLoc = obj.rentabilidade.match(regexNumerico)[0];

  const expDot = /\./g;
  const expComma = /\,/g;
  const aplicMinStandard = obj.minimo.toLocaleString('pt-BR', { style: 'decimal' });
  const rentabStandard = Number(rentabValueLoc.replace(expDot, '').replace(expComma, '.'));

  const ipcaCond = ob => ob.rentabilidade.toLowerCase().includes('ipca');
  const cdiCond = ob => ob.rentabilidade.toLowerCase().includes('cdi');
  const selicCond = ob => ob.rentabilidade.toLowerCase().includes('selic');
  const prefixedCond = ob => ob.rentabilidade.toLowerCase().includes('prefixado');
  const postfixedYield = o => ipcaCond(o) || cdiCond(o) || selicCond(o) || !prefixedCond(o);
  const liquidezVenc = o => o.resgateFormatado.toLowerCase().includes('no vencimento');

  const yieldPercent = parseFloat(
    (rentabStandard/100)
    .toFixed(4)
  )
    .toLocaleString(
      'pt-BR',
      { style: 'decimal', minimumFractionDigits: 4 }
    );

  return {
    distr: 'Vitreo',
    emissor: inputArrEmissores.find(ob => ob.codigo === obj.codigoEmissor).nome.trim().replace('  ', ' '),
    tipoPapel: obj.titulo,
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    liquidez: liquidezVenc(obj) ? 'vcto' : '?',
    invMin: aplicMinStandard,
    vencimento: obj.prazoFormatado,
    payJuros: 'vcto',
    amort: 'vcto',
    ir: obj.impostoRenda ? 1 : 0,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'CDI' : selicCond(obj) ? 'SELIC' : '-',
    posPercentIndex: obj.rentabilidade.includes('% do ') ? yieldPercent : '-',
    posIndexPlus: obj.rentabilidade.includes('+') ? yieldPercent : '-',
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
