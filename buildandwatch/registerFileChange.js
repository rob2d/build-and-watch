
/** hash which keeps track of 
 * when file changes were 
 * detected to avoid duplicated
 * events fired or thrashing
 * build/emu process spawning
 */
let fileChangeTimeMap = {}

/**
 * register that a file has changed
 * into our map and return a boolean
 * telling us whether or not this
 * was a false positive
 * 
 * @param {*} param0 
 * @param {String} filename
 * @returns {Boolean} 
 */
function registerFileChange({ filename }) {
    const currentTime = new Date().getTime();
    if(fileChangeTimeMap[filename]) {
        const timeSinceUpdated = (currentTime - fileChangeTimeMap[filename]);
        fileChangeTimeMap[filename] = currentTime;

        // if more than 250 ms has occured,
        // note that it has updated
        return (timeSinceUpdated > 250);
    }
    else {
        fileChangeTimeMap[filename] = new Date().getTime();        
        return true;
    }
}

module.exports = registerFileChange;