// creates a table for sin/cos
// 
// arguments : inputFile
// output    : output.txt

const args = require('yargs').argv;
const fs   = require('fs');

function toRadian(degree) {
    return degree * Math.PI/180;
}

let sinStr = `signed INT16 sinBy2s={ \n\t`; 
let cosStr = `signed INT16 cosBy2s={ \n\t`;

for(let angle = 0; angle < 360; angle += 2) {
    // simulate shift << 5 by multiplying and rounding
    const sinEntry = Math.round(Math.sin(toRadian(angle)) * 32);
   
    sinStr += sinEntry + (angle != 358 ? ', ' : '');

    const cosEntry = Math.round(Math.cos(toRadian(angle)) * 32);
   
    cosStr += cosEntry + (angle != 358 ? ', ' : '');
    

    if(angle && ((angle+2) % 10 == 0)) {
        sinStr += '\n\t';
        cosStr += '\n\t';
    }

    if(angle && angle == 358) {
        sinStr += ' };';
        cosStr += ' };';
    }
}


fs.writeFileSync('sincos.h', `${sinStr}\n\n${cosStr}`, 'utf-8');