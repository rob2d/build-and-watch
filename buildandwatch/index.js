const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const process = require('process');

const config = require('./../config.json');
const spawn = require('child_process').spawn;

const inputPath = path.resolve(config.watchFolder, config.inputSourceFile);
const outputPath = path.resolve(__dirname, './../', config.outputFileName);

// keeps track of when the last processes
// were spawned (fs.watch is unstable
// and we do not want to launch many
// emulators simultaneously for batch
// changes) [TODO]
//let lastSpawnedProcessAt = new Date();

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

function buildROM () {
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

if(config.buildOnStart) {
    buildROM().then(config.openEmuOnStart ? launchEmu : null);
} else if(config.openEmuOnStart) {
    openEmuOnStart();
}

// watch for changes to the configuration folder,
// and if change detected for .c/.h,
// spawn and manage required processes as needed

console.log(`\nwatching for *.c|h file changes at: ${config.watchFolder}`);
fs.watch(config.watchFolder, (action, filename)=> {
    if(filename.match(/.[ch]$/)) {
        console.log(`c or h file was updated:  ${filename} (${action})`);  

        buildROM({ outputPath }).then(config.openEmuOnChange ? launchEmu : null);
    }
});