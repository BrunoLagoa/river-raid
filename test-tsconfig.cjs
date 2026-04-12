const fs = require('fs');
const ts = require('typescript');
const { config, error } = ts.parseConfigFileTextToJson('tsconfig.app.json', fs.readFileSync('tsconfig.app.json', 'utf8'));
if (error) console.error(error);
const result = ts.parseJsonConfigFileContent(config, ts.sys, './');
console.log("ERRORS:", JSON.stringify(result.errors, null, 2));
