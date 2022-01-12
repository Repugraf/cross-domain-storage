const { resolve } = require("path");
const { addExtToFilesRecursive } = require("@repugraf/rewrite-esm-paths");

addExtToFilesRecursive(resolve(__dirname, "..", "lib", "esm"), "js");
console.log("Added js extensions to esm build files");
