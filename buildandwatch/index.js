const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;

const registerFileChange = require('./registerFileChange');
const buildROM = require('./buildROM');
const { launchEmu } = require ('./emuManagement');

const config = require('./../config.json');

const inputPath = path.resolve(config.watchFolder, config.inputSourceFile);
const outputPath = path.resolve(__dirname, './../', config.outputFileName);

// launch emu with necessary params
const launchEmuWParams = ()=> {
    return launchEmu({ 
        romPath : outputPath, 
        emuPath : config.emuPath 
    });
};

// build and launch ROM on start
// according to configuration settings

if(config.buildOnStart) {
    buildROM({ inputPath, outputPath })
        .then(config.openEmuOnStart ? launchEmuWParams : null )
        .catch(error => console.error(error) );

    } else if(config.openEmuOnStart) {
    openEmuOnStart();
}

// watch for changes to the configuration folder,
// and if change detected for .c/.h,
// spawn and manage required processes as needed

console.log(`\nwatching for *.c|h file changes at: ${config.watchFolder}`);
fs.watch(config.watchFolder, (action, filename)=> {
    if(filename.match(/\.[ch]$/)) {
        const isValidChange = registerFileChange({ filename });

        if(isValidChange) {
            console.log(`c or h file was updated:  ${filename} (${action})`);  
            buildROM({ inputPath, outputPath })
                .then(config.openEmuOnChange ? launchEmuWParams : null)
                .catch( error => console.error(error) );
        }
    }
});