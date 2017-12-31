const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;
const BuildModes = require('./constants/BuildModes');
const copyDir = require('copy-dir');
const recursiveReadSync = require('recursive-readdir-sync');
const { gbdkPath } = require('./../config.json');

// POSSIBLE OPTIMIMZATIONS : DO NOT USE ASYNC FILE WRITING CODE
//                           ASYNC & PROMISIFY THOSE REQUESTS,
//                           AND RUN IN PARALLEL

function buildROM ({ 
    inputSourceFile, 
    outputFilePath, 
    watchFolder, 
    tmpBuildDir, 
    buildMode 
}) {
    return new Promise((resolve,reject)=> {

        // check for and remove existing target ROM file 
        // if needed before executing commands

        if(fs.existsSync(outputFilePath)) {
            fs.removeSync(outputFilePath);
            console.log('removed existing ROM at ' + outputFilePath); 
        }

        if(fs.existsSync(tmpBuildDir)) {
            fs.removeSync(tmpBuildDir);
        }

        // first copy files to temporary path
        if(!fs.existsSync(tmpBuildDir)) {
            fs.mkdirSync(tmpBuildDir);
            copyDir.sync(watchFolder, tmpBuildDir);
        }

        console.log('copied dependencies and files from ' + watchFolder + ' into ' + tmpBuildDir);

        const files = recursiveReadSync(tmpBuildDir);

        // edit all #include "xxx" to #include 
        // "OSfilePath/xxx" automatically
        // for any c/h file
        const expandIncludes = (fileContent)=> {
            return fileContent.replace(/(#include ")(.+\.[c|h])(")/g, (match, include, file, close)=> {
                return `${include}${path.resolve(tmpBuildDir, file)}${close}`;
            });
        };

        files.forEach( f => {
            const fileType = f.substr(f.lastIndexOf('.')+1);
            if(fileType == 'c' || fileType == 'h') {
                const filePath = path.resolve(f);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                
                fs.writeFileSync(filePath, expandIncludes(fileContent), 'utf-8');
            }
        });

        console.log('building ROM at ' + outputFilePath);

        spawnLccProcess({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode })
            .then( resolve ).catch( reject );
    })
}

function spawnLccProcess ({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode }) {
    return new Promise((resolve, reject)=> {
        {
            let hasThrownError = false;
            //run the gbdk build process
            const inputPath = path.resolve(tmpBuildDir, inputSourceFile)
            const lccProcess = spawn(`lcc` , 
                (buildMode == BuildModes.GBC ? 
                    [ inputPath,'-Wl-yp0x143=0x80', `-o`, outputFilePath] :
                    [ inputPath, '-o', outputFilePath]
                ), { cwd : gbdkPath } 
            );
            
            lccProcess.stdout.on('data', function (data) { 
                console.log('lcc output: ' + data);
            });   
            
            
            lccProcess.stderr.on('data', function (data) {
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
            
            lccProcess.on('exit', function (code) {
                
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

module.exports = buildROM;