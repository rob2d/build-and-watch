const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const path = require('path');
const spawn = require('child_process').spawn;
const BuildModes = require('./constants/BuildModes');
const recursiveReadSync = require('recursive-readdir-sync');
const { gbdkPath, banks } = require('./config');

const assembleBuildROMCmds = require('./assembleBuildROMCmds');

function spawnLccProcess ({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode }) {
    return new Promise((resolve, reject)=> {
        {
            let hasThrownError = false;
            //run the gbdk build process
            const inputPath = path.resolve(tmpBuildDir, inputSourceFile);

            const lccCommands = spawn(assembleBuildROMCmds({ 
                inputPath, 
                tmpBuildDir, 
                outputFilePath, 
                buildMode 
            }), { 
                cwd : gbdkPath, 
                shell : true 
            });
            
            lccCommands.stdout.on('data', function (data) { 
                console.log('lcc output: ' + data);
            });   
                        
            lccCommands.stderr.on('data', function (data) {
                data = data + ''; // give data the string prototype
                const error = 'lcc error: ' + data;

                // do not reject if it is simply a warning
                // but be sure to print out the output
                if(!data.match(/warning \*\*\*/i)) {
                    hasThrownError = true;
                    reject(error);
                } else {
                    console.log(error);
                    resolve(data);
                }
            });

            // on exit, resolve or reject based on 
            // error status code
            
            lccCommands.on('exit', function (code) {
                
                // prioritizing exit codes only if we
                // have not already thrown explicit error

                if(!hasThrownError && code != 0) {
                    console.log('lcc process exited with code ' + code);            
                    reject('lcc process failed with code ' + code);    
                } else {
                    resolve();
                }
            }); 
        };        
    });
}

module.exports = spawnLccProcess;