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

  const yieldPercent = parseFloat(
    (rentabStandard/100)
    .toFixed(4)
  )
    .toLocaleString(
      'pt-BR',
      { style: 'decimal', minimumFractionDigits: 4 }
    );

  const parserPrazo = prazo => {
    let monthsOffset;
    let yearsOffset;
    let erro;
    switch (prazo) {
      case '1 mês': monthsOffset = 1; yearsOffset = 0; break;
      case '2 meses': monthsOffset = 2; yearsOffset = 0; break;
      case '3 meses': monthsOffset = 3; yearsOffset = 0; break;
      case '4 meses': monthsOffset = 4; yearsOffset = 0; break;
      case '5 meses': monthsOffset = 5; yearsOffset = 0; break;
      case '6 meses': monthsOffset = 6; yearsOffset = 0; break;
      case '1 ano': monthsOffset = 0; yearsOffset = 1; break;
      case '1 ano e 3 meses': monthsOffset = 3; yearsOffset = 1; break;
      case '1 ano e 6 meses': monthsOffset = 6; yearsOffset = 1; break;
      case '2 anos': monthsOffset = 0; yearsOffset = 2; break;
      case '2 anos e 6 meses': monthsOffset = 6; yearsOffset = 2; break;
      case '3 anos': monthsOffset = 0; yearsOffset = 3; break;
      case '4 anos': monthsOffset = 0; yearsOffset = 4; break;
      case '5 anos': monthsOffset = 0; yearsOffset = 5; break;
      case '6 anos': monthsOffset = 0; yearsOffset = 6; break;
      case '7 anos': monthsOffset = 0; yearsOffset = 7; break;
      default: erro = true; break;
    }
    if (erro) return 'Verificar';
    const nowDate = new Date();
    const maturityDate = new Date(
      nowDate.getFullYear() + yearsOffset,
      nowDate.getMonth() + monthsOffset,
      nowDate.getDate()
    );
    return maturityDate.toLocaleDateString('pt-BR', {timeZone: 'America/Recife'});
  }
  
  return {
    distr: 'Vitreo',
    emissor: inputArrEmissores.find(ob => ob.codigo === obj.codigoEmissor).nome.trim().replace('  ', ' '),
    tipoPapel: obj.titulo,
    tipoRentab: postfixedYield(obj) ? 'Pos' : 'Pre',
    invMin: aplicMinStandard,
    vencimento: parserPrazo(obj.prazoFormatado),
    ir: obj.impostoRenda ? 1 : 0,
    preRentAA: postfixedYield(obj) ? '-' : yieldPercent,
    posRentIndex: ipcaCond(obj) ? 'IPCA' : cdiCond(obj) ? 'DI' : selicCond(obj) ? 'SELIC' : '-',
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
