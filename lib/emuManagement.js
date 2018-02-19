const process = require('process');
const spawn = require('child_process').spawn;

/**
 *  stack of emulator exe's which have
 *  been launched so far; useful to
 *  kill all existing processes when 
 *  launching a new one
 */

const spawnedEmuPIDs = [];

function closeLaunchedEmuInstances () {
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

function launchEmu({ emuPath, romPath }) {
    return new Promise((resolve, reject)=> {
        closeLaunchedEmuInstances();
        
        const emuProcess = spawn(emuPath, [romPath]);
        spawnedEmuPIDs.push(emuProcess.pid);
        
        console.log('launching emulator!');
    
        emuProcess.on('exit', function(code) {
            if(code != 0 && code != 1) {
                    console.log('emu process exited with code ' + code);
                    reject('emu process exited with code ' + code)
            } else {
                resolve();
            }
        });
    });
}

module.exports = { launchEmu };