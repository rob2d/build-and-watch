const fs   = require('fs');
const path = require('path');
const args = require('yargs').argv;

// TODO : validate that all required input matches
//        and files which should be files are files
//        and types correspond correctly
function validateConfiguration (configObj) {
    let wasSuccessful = true;
    return { wasSuccessful };
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
        console.error('Error: configuration was invalid');
        process.exit(0);
    } else {
        return that;        
    }   
})();

module.exports = instance;