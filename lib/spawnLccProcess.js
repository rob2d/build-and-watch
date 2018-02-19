const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const path = require('path');
const spawn = require('child_process').spawn;
const BuildModes = require('./constants/BuildModes');
const copyDir = require('copy-dir');
const recursiveReadSync = require('recursive-readdir-sync');
const { gbdkPath, banks } = require('./config');

let useBanks = (banks && banks.length);

function createBankFileCmd (bankNo, filePath, tmpBuildDir) {
    const bankPath = path.resolve(tmpBuildDir, `bank${bankNo}.o`);
    return (`lcc -Wa-l -Wf-bo${bankNo} -Wl-ya${bankNo} ` +
                `-c -o ${bankPath} ${filePath}`);
};

function getOExtensionFile (inputPath) {
    const cExtIndex = inputPath.lastIndexOf('.c'); 
    return `${inputPath.substr(0,cExtIndex)}.o`;
}

/**
 * Commands needed to build a ROM
 * @param {*} param0 
 */
function getBuildROMCmds ({ inputPath, buildMode, outputFilePath, tmpBuildDir }) {
    
    const rom0Target = getOExtensionFile(
        path.resolve(tmpBuildDir,path.basename(inputPath))
    );

    // namespace for command line segments
    const C = {
        gbcParam : (buildMode == BuildModes.GBC ? ' -Wl-yp0x143=0x80':''),
        buildBanks : '',
        bankBuildParams : useBanks ? '-Wl-m -Wl-yt1 -Wl-yo4 ':'',
        buildRom0 : `lcc -Wa-l -c -o ${rom0Target} ${inputPath}`,
        inputFilesParam : ''
    };

    banks && banks.forEach( (b, i) => {
        const isLast = (banks.length == i+1);
        
        const bankCPath = path.resolve(tmpBuildDir, b);
        C.buildBanks += `${createBankFileCmd(i+1, bankCPath, tmpBuildDir)} && `;

        const bankOPath = path.resolve(tmpBuildDir, `bank${i+1}.o`);
        C.inputFilesParam += `${(i==0)?' ':''}${bankOPath} `;
    });

    C.inputFilesParam += rom0Target;

    // if output file path doesn't exist, create it
    const outputFileDir = path.dirname(outputFilePath);

    if(!fs.existsSync(path.dirname(outputFileDir))) {
        fs.mkdirp(path.dirname(outputFileDir));
    };

    let cmds = `${C.buildBanks}${C.buildRom0} && lcc ${C.bankBuildParams}${C.gbcParam} -o ${outputFilePath} ${C.inputFilesParam}`;
    console.log('\nbuild commands:\n', cmds, '\n');
    return cmds;
};

function spawnLccProcess ({ inputSourceFile, tmpBuildDir, outputFilePath, buildMode }) {
    return new Promise((resolve, reject)=> {
        {
            let hasThrownError = false;
            //run the gbdk build process
            const inputPath = path.resolve(tmpBuildDir, inputSourceFile);

            const lccCommands = spawn(getBuildROMCmds({ inputPath, tmpBuildDir, outputFilePath, buildMode }), 
                { cwd : gbdkPath, shell : true }
            );
            
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