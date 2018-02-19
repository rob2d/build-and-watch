const fs   = require('fs');
const path = require('path');
const args = require('yargs').argv;
const colors = require('colors');

function createIssue(field, issue) {
    return `${field}:`.bold.white + ` ${issue}`;
}

/**
 * Validates the configuration passed,
 * returns a printable list of any issues
 * that existed or a message describing
 * the output along with whether the
 * configuration verification was 
 * successful
 * 
 * @param {*} configObj 
 */
function validateConfiguration (configObj) {
    let wasSuccessful = true;
    let issues = [];
    let output = undefined;

    //===========================//
    //        gbdkBinPath        // 
    //===========================//
    
    if(!configObj.gbdkBinPath) {
        issues.push(createIssue('gbdkBinPath', 'wasn\'t specified'));
    } else {
        const { gbdkBinPath } = configObj;

        if(!fs.existsSync(gbdkBinPath)) {
            issues.push(createIssue('gbdkBinPath', 'bin path doesn\'t exist'));
        } else if(!fs.existsSync(path.resolve(gbdkBinPath,'lcc.exe'))) {
            issues.push(createIssue('gbdkBinPath', 'lcc.exe doesn\'t exist at the specified gbdk bin path'));
        }
    }

    //===========================//
    //         emuPath           // 
    //===========================//

    // TODO : pass a warning and alter
    // other flags as needed so that
    // users don't need to run an emu

    if(!configObj.emuPath) {
        issues.push(createIssue('emuPath', 'wasn\'t sspecified'));
    } else {
        if(!fs.existsSync(configObj.emuPath)) {
            issues.push(createIssue('emuPath', 'file doesn\'t exist at path specified'));
        } // TODO : check if !isDirectory
    }

    //===========================//
    //      openEmuOnStart       //
    //===========================//

    // TODO : pass warning that wasn't specified
    // when setting a default
    if(typeof configObj.openEmuOnStart == 'undefined') {
        configObj.openEmuOnStart = true;
    }

    //===========================//
    //      openEmuOnChange      //
    //===========================//

    // TODO : pass warning that wasn't specified
    // when setting a default
    if(typeof configObj.openEmuOnChange == 'undefined') {
        configObj.openEmuOnChange = true;
    }

    //===========================//
    //        buildOnStart       //
    //===========================//

    // TODO : pass warning that wasn't specified
    // when setting a default
    if(typeof configObj.buildOnStart == 'undefined') {
        configObj.buildOnStart = true;
    }

    //===========================//
    //        buildForGBC        //
    //===========================//

    // TODO : pass warning that wasn't specified
    // when setting a default
    if(typeof configObj.buildForGBC == 'undefined') {
        configObj.buildForGBC = true;
    }

    //===========================//
    //        watchFolder        //
    //===========================//

    if(!configObj.watchFolder) {
        issues.push(createIssue('watchFolder', 'wasn\'t specified'));
    } else if(!fs.existsSync(configObj.watchFolder)){
        issues.push(createIssue('watchFolder', 'doesn\'nt exist at path specified'));
    } // TODO : check if isDirectory

    //===========================//
    //     inputSourceFile       //
    //===========================//

    if(!configObj.inputSourceFile) {
        issues.push(createIssue('inputSourceFile', 'wasn\'t specified'));
    } else if(configObj.watchFolder && !fs.existsSync(path.resolve(configObj.watchFolder, configObj.inputSourceFile))){
        issues.push(createIssue('inputSourceFile', 'doesn\'t exist at watchFolder path specified'));
    } // TODO : check if !isDirectory

    //===========================//
    //     outputFileName        //
    //===========================//

    if(!configObj.outputFileName) {
        issues.push(createIssue('outputFileName', 'wasn\'t specified'));
    } // TODO : check file extension as .gb/.gbc

    if(issues.length > 0) {
        wasSuccessful = false;
        output =  issues.join('\n');
    }
    return { wasSuccessful, output };
}


function findConfigPath (configPath) {
    if(!configPath) {
        return undefined;
    }
    // first check for path at cwd
    if(fs.existsSync(path.resolve(process.cwd(),configPath))) {
        return path.resolve(process.cwd(),configPath);
    } 
    // then absolute path
    else if(fs.existsSync(path.resolve(__dirname,configPath))) {
        return path.resolve(__dirname,configPath);
    } else {
        return undefined;
    }
}

/**
 * return an instance containing
 * things contained in configuration
 * along with an "init" param when
 * validates/parses the config from
 * the command line arg for "config"
 */
const instance = (function(){
    const that = {};
    const configPath = findConfigPath(args.config);
    let configFile;

    // in the case where config argument not provided,
    // lets check for a valid config.json @ cwd

    if(typeof args.config == 'undefined') {
        if(findConfigPath('config.json')) {
            configFile = require(findConfigPath('config.json'));
        } else {            
            console.error('Error: No config.json found in current working directory and '+
            'no argument provided for "config" to look up config file');
            process.exit(0);
        }
    }

    if(!configFile) {
        if(typeof args.config == 'undefined') {
            console.error('Error: Please specify a valid configuration path ' +
            'as either relative to your current working directory or ' +
            'an absolute path.');
            process.exit(0);
        } else {
            configFile = require(configPath);
        }
    }

    Object.keys(configFile).forEach( key => {
        that[key] = configFile[key];
    });

    const validationResult = validateConfiguration(that);

    if(!validationResult.wasSuccessful) {
        console.error('\nConfiguration file detected issues and cannot continue: \n\n', 
            validationResult.output
        );
        process.exit(0);
    } else {
        return that;        
    }   
})();

module.exports = instance;