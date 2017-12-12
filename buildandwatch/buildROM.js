const fs = require('fs');
const spawn = require('child_process').spawn;
const BuildModes = require('./constants/BuildModes');

function buildROM ({ inputPath, outputPath, buildMode }) {
    return new Promise((resolve,reject)=> {
        let hasThrownError = false;

        // check for and remove existing target ROM file 
        // if needed before executing commands

        if(fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log('removed existing ROM at ' + outputPath); 
        }
        
        console.log('building ROM at ' + outputPath);
        

        //run the gbdk build process

        const lccProcess = spawn(`lcc` , 
            buildMode == BuildModes.GBC ? 
                [ inputPath,'-Wl-yp0x143=0x80', `-o`, outputPath] :
                [ inputPath, '-o', outputPath]
        );
        
        lccProcess.stdout.on('data', function (data) { 
            console.log('lcc output: ' + data);
        });   
        
        
        lccProcess.stderr.on('data', function (data) {
            const error = 'lcc error: ' + data;
            hasThrownError = true;
            reject(error);
        });

        // on exit, resolve or reject based on 
        // error status code
        
        lccProcess.on('exit', function (code) {
            
            // prioritizing exit codes only if we
            // have not already thrown explicit error

            if(!hasThrownError && code != 0) {
                console.log('lcc process exited with code ' + code);            
                reject('lcc process failed with code ' + code);    
            } else {
                resolve();
            }
        });   
    });
}

module.exports = buildROM;