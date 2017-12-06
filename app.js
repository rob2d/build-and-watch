const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const process = require('process');

const config = require('./config.json');
const spawn = require('child_process').spawn;

fs.watch(config.watchFolder, (action, filename)=> {
    if(filename.match(/.[ch]$/)) {
        console.log('c or h file changed!', JSON.stringify(filename));  
        
        const inputPath = path.resolve(config.watchFolder, config.inputSourceFile);
        const outputPath = path.resolve(__dirname, config.outputFileName);

        // check for and remove gb file if needed before executing commands
        if(fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        const lccCommand = spawn(`lcc` , [`${inputPath}`, `-o`, `${outputPath}`]);
        
        lccCommand.stdout.on('data', function (data) {    // register one or more handlers
            console.log('stdout: ' + data);
        });   
         
        lccCommand.stderr.on('error', function (data) {
            console.log('stderr: ' + data);
        });
          
        lccCommand.on('exit', function (code) {
            if(code != 0) {
                console.log('child process exited with code ' + code);                
            } else {
                if(config.openEmuOnChange) {
                    const emuSpawn = spawn(config.emuPath, [outputPath]);

                    emuSpawn.on('exit', function(code) {
                        if(code != 0) {
                            console.log('child process exited with code ' + code);
                        } else {
                            console.log('launching emulator!');
                        }
                    });
                }
            }
        });   
    }
});