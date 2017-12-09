const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const process = require('process');

const config = require('./../config.json');
const spawn = require('child_process').spawn;

const inputPath = path.resolve(config.watchFolder, config.inputSourceFile);
const outputPath = path.resolve(__dirname, './../', config.outputFileName);

const registerFileChange = require('./registerFileChange');
const buildROM = require('./buildROM');;



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

function launchEmu() {
    return new Promise((resolve, reject)=> {
        closeLaunchedEmuInstances();
        
        const emuProcess = spawn(config.emuPath, [outputPath]);
        spawnedEmuPIDs.push(emuProcess.pid);
        
        console.log('launching emulator!');
    
        emuProcess.on('exit', function(code) {
            if(code != 0 && code != 1) {
                    console.log('emu process exited with code ' + code);
            }
        });
    });
}

// build and launch ROM on start
// according to configuration settings

if(config.buildOnStart) {
    buildROM({ inputPath, outputPath })
        .then(config.openEmuOnStart ? launchEmu : null );

    } else if(config.openEmuOnStart) {
    openEmuOnStart();
}

// watch for changes to the configuration folder,
// and if change detected for .c/.h,
// spawn and manage required processes as needed

console.log(`\nwatching for *.c|h file changes at: ${config.watchFolder}`);
fs.watch(config.watchFolder, (action, filename)=> {
    if(filename.match(/.[ch]$/)) {
        const isValidChange = registerFileChange({ filename });

        if(isValidChange) {
            console.log(`c or h file was updated:  ${filename} (${action})`);  
            buildROM({ inputPath, outputPath })
                .then(config.openEmuOnChange ? launchEmu : null);
        }
    }
});