const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const process = require('process');

const config = require('./config.json');
const spawn = require('child_process').spawn;

// keeps track of when the last processes
// were spawned (fs.watch is unstable
// and we do not want to launch many
// emulators simultaneously for batch
// changes)
//let lastSpawnedProcessAt = new Date();

/**
 *  stack of emulator exe's which have
 *  been launched so far; useful to
 *  kill all existing processes when 
 *  launching a new one
 */

const spawnedEmuPIDs = [];

function closeAllEmuInstances () {
    while(spawnedEmuPIDs.length > 0) {
        const pid = spawnedEmuPIDs.pop();
        try {
            process.kill(pid);            
        } catch(err) {
            console.error(`The emulator process with pid of ${pid} which was ` + 
            `attempted to be closed no longer exists`);
        }
    }
}

// watch for changes to the configuration folder,
// and if change detected for .c/.h,
// spawn and manage required processes as needed

fs.watch(config.watchFolder, (action, filename)=> {
    if(filename.match(/.[ch]$/)) {
        console.log(`c or h file was updated:  ${filename} (${action})`);  
        
        const inputPath = path.resolve(config.watchFolder, config.inputSourceFile);
        const outputPath = path.resolve(__dirname, config.outputFileName);

        // check for and remove gb file if needed before executing commands
        if(fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        const lccProcess = spawn(`lcc` , [`${inputPath}`, `-o`, `${outputPath}`]);
        
        lccProcess.stdout.on('data', function (data) {    // register one or more handlers
            console.log('stdout: ' + data);
        });   
         
        lccProcess.stderr.on('error', function (data) {
            console.log('stderr: ' + data);
        });
          
        lccProcess.on('exit', function (code) {
            if(code != 0) {
                console.log('lcc process exited with code ' + code);                
            } else {
                if(config.openEmuOnChange) {
                    closeAllEmuInstances();

                    const emuProcess = spawn(config.emuPath, [outputPath]);
                    spawnedEmuPIDs.push(emuProcess.pid);

                    emuProcess.on('exit', function(code) {
                        if(code != 0) {
                            console.log('emu process exited with code ' + code);
                        } else {
                            console.log('launching emulator!');
                        }
                    });
                }
            }
        });   
    }
});