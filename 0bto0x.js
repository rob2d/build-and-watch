// converts 0b byte to 0x hex within a file
// 
//arguments : inputFile
// output: output.txt

const args = require('yargs').argv;
const fs   = require('fs');

const { input, output } = args;

if(!input || !output) {
    console.error('Error must provide an "input" and "output" ' +
    'parameter corresponding to the files you would like to work with');
    
    process.exit(1);
}

const fileContents = fs.readFileSync(input, 'utf8');

const hexOutput = fileContents.replace(/0b([01]+)/g, (match)=> {
    const binaryNumber = match.substr(2);
    return '0x' + parseInt(binaryNumber, 2).toString(16).toUpperCase();
});

console.log('hex output ->', hexOutput);

fs.writeFileSync(output, hexOutput, 'utf-8');