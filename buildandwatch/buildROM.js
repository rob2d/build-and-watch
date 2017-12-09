const fs = require('fs');
const spawn = require('child_process').spawn;

function buildROM ({ inputPath, outputPath }) {
    return new Promise((resolve,reject)=> {

        // check for and remove existing target ROM file 
        // if needed before executing commands

        if(fs.existsSync(outputPath)) {
            
            console.log('removing existing ROM at ' + outputPath);        
            fs.unlinkSync(outputPath);
        }
        
        console.log('building ROM at ' + outputPath);
        

        //run the gbdk build process

        const lccProcess = spawn(`lcc` , [`${inputPath}`, `-o`, `${outputPath}`]);
        
        lccProcess.stdout.on('data', function (data) {    // register one or more handlers
            console.log('lcc output: ' + data);
        });   
        
        lccProcess.stderr.on('error', function (data) {
            console.log('lcc error: ' + data);
        });

        // on exit, resolve or reject based on 
        // error status code
        
        lccProcess.on('exit', function (code) {
            if(code != 0) {
                console.log('lcc process exited with code ' + code);            
                reject('lcc process failed with code ' + code);    
            } else {
                resolve();
            }
        });   

    });
}

module.exports = buildROM;