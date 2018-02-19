/**
 * How long between file
 * updates should we buffer
 * against double-writes
 * (due to things such as VC)
 */
const BUFFER_TIME = 250;

/** 
 * Map which keeps track of 
 * when file changes were 
 * detected to avoid duplicated
 * events fired or thrashing
 * build/emu process spawning
 */
let fileChangesMap = new Map();

/**
 * register that a file has changed
 * into our map and resolve a boolean
 * telling us whether or not this
 * was a false positive
 * 
 * @param {*} param0 
 * @param {String} param0.filename
 * @returns {Boolean} 
 */
function registerFileChange({ filename }) {
    return new Promise((resolve, reject)=> {
        // record current file update time
        const updatedAt = new Date().getTime();

        // record this entry at the filename map
        fileChangesMap.set(filename, updatedAt);

        // run a timeout to be sure this was the
        // most recent update to the specific
        // file before triggering success
        
        setTimeout(()=> {
            resolve(fileChangesMap.get(filename) >= updatedAt);
        }, BUFFER_TIME);
    });
}

module.exports = registerFileChange;