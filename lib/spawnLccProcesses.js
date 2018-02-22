const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const path = require('path');
const spawn = require('child_process').spawn;
const BuildModes = require('./constants/BuildModes');
const recursiveReadSync = require('recursive-readdir-sync');
const { gbdkBinPath, banks } = require('./config');
const promiseSerial = require('promise-serial');

const assembleBuildROMCmds = require('./assembleBuildROMCmds');

function spawnLccProcess ({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode }) {
    return new Promise((resolve, reject)=> {
        {
            let hasThrownError = false;
            //run the gbdk build process
            const inputPath = path.resolve(tmpBuildDir, inputSourceFile);

            const cmds = assembleBuildROMCmds({ 
                inputPath, 
                tmpBuildDir,  
                outputFilePath, 
                buildMode 
            });

            const cmdRequests = cmds.map( (cmd,i) => ()=> 
                new Promise((resolve, reject) => {
                
                console.log((i+1)+'>', cmd);
                const lccCommand = spawn(cmd, { 
                    cwd : gbdkBinPath, 
                    shell : true 
                });
                
                lccCommand.stdout.on('data', (data)=> {   
                    console.log('lcc output: ' + data);
                    lccCommand.kill();
                });   
                            
                lccCommand.stderr.on('data', (data)=> {
                    data = data + ''; // give data the string prototype                    const error = 'lcc error: ' + data;
    
                    // do not reject if it is simply a warning
                    // but be sure to print out the output
                    if(!data.match(/warning \*\*\*/i)) {
                        hasThrownError = true;
                        reject(data);
                    } else {
                        console.log(data);
                        resolve(data);
                    }
                    lccCommand.kill();
                });
    
                // on exit, resolve or reject based on 
                // error status code
                
                lccCommand.on('exit', (code)=> {
                    
                    // prioritizing exit codes only if we
                    // have not already thrown explicit error
    
                    if(!hasThrownError && code != 0) {
                        console.log('lcc process exited with code ' + code);            
                        reject('lcc process failed with code ' + code);    
                    } else {
                        console.log('exiting!');
                        resolve();
                    }
    
                    lccCommand.kill();
                }); 
            }));

            promiseSerial(cmdRequests).then(results => {
                console.log('\n');
                resolve(results);
            });
        }   
    });
}

module.exports = spawnLccProcess;