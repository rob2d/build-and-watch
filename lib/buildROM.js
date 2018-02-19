const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;
const copyDir = require('copy-dir');
const recursiveReadSync = require('recursive-readdir-sync');
const spawnLccProcess = require('./spawnLccProcess');

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
        const expandIncludes = ({ fileContent, filePathDir })=> {
            return fileContent.replace(/(#include ")(.+\.[c|h])(")/g, (match, include, file, close)=> {
                return `${include}${path.resolve(filePathDir, file)}${close}`;
            });
        };

        files.forEach( f => {
            const fileType = f.substr(f.lastIndexOf('.')+1);
            if(fileType == 'c' || fileType == 'h') {
                const filePath = path.resolve(tmpBuildDir, f);

                // grab last index of relative file path
                let indexOfFolderChar =f.lastIndexOf('\\');
                if(indexOfFolderChar == -1) {
                    indexOfFolderChar = f.lastIndexOf('/');
                }

                const filePathDir = (indexOfFolderChar != -1) ? f.substr(0, indexOfFolderChar):'';
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                
                fs.writeFileSync(filePath, expandIncludes({ fileContent, filePathDir }), 'utf-8');
            }
        });

        console.log('building ROM at ' + outputFilePath);

        spawnLccProcess({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode })
            .then( resolve ).catch( reject );
    })
}

module.exports = buildROM;