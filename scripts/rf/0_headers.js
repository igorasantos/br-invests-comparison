const fs = require('fs');
const assetClass = 'rf';

const mapperArrReturn = [{
  distr: '',
  emissor: '',
  tipoPapel: '',
  tipoRentab: '',
  liquidez: '',
  invMin: '',
  payJuros: '',
  amort: '',
  ir: '',
  preRentAA: '',
  posRentIndex: '',
  posPercentIndex: '',
  posIndexPlus: '',  
}];
const outputArr = mapperArrReturn;
const csvStr = [
  [...Object.keys(outputArr[0])],
].map(e => e.join(";")).join("\n");

const dir = `${process.cwd()}/outputs/${assetClass}`;

if (!fs.existsSync(dir)){
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFile(
  `${dir}/0_headers.csv`,
  csvStr,
  err => {
    console.log(err || `${assetClass} / headers : Arquivo salvo!`);
  }
);