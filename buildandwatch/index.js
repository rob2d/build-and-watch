const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;
const notifier = require('node-notifier');

const BuildModes = require ('./constants/BuildModes');
const registerFileChange = require('./registerFileChange');
const buildROM = require('./buildROM');
const { launchEmu } = require ('./emuManagement');
const config = require('./../config.json');
const { watchFolder, inputSourceFile } = config;

const sourceFilePath = path.resolve(watchFolder, inputSourceFile);
const tmpBuildDir = path.resolve(__dirname, './_tmp');
const outputFilePath = path.resolve(__dirname, './../', config.outputFileName);

// by default, build ROMs designed to take advantage of GBC
const buildMode = (typeof config.buildForGBC != 'undefined' && !config.buildForGBC) ?
                    BuildModes.GB : BuildModes.GBC;

const handleError = (error) => {
    if(config.showOSErrorNotices) {
        notifier.notify({
            title   : 'Error occured',
            message : error,
            sound   : config.playErrorSound
        })
    }
    console.log(error);
};

// launch emu with necessary params
const launchEmuWParams = ()=> {
    return launchEmu({ 
        romPath : outputFilePath, 
        emuPath : config.emuPath 
    });
};

// build and launch ROM on start
// according to configuration settings

const buildParams = { 
    sourceFilePath, 
    inputSourceFile, 
    tmpBuildDir, 
    watchFolder, 
    outputFilePath, 
    buildMode 
};

if(config.buildOnStart) {
    buildROM(buildParams)
        .then(config.openEmuOnStart ? launchEmuWParams : null )
        .catch((handleError));

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
            buildROM(buildParams)
                .then(config.openEmuOnChange ? launchEmuWParams : null)
                .catch(handleError);
        }
    }
});