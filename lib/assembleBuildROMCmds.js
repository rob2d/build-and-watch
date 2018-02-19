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
function assembleBuildROMCmds ({ inputPath, buildMode, outputFilePath, tmpBuildDir }) {
    
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

module.exports = assembleBuildROMCmds;