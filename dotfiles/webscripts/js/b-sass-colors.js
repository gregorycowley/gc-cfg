const defaultMaxError = 50;
const usage = `
b-sass-colors [-e maxError][-n][-b] <file>[, <file>...]
 -e maxError - (default ${defaultMaxError}) the maximum difference allowed when looking at the difference between colors
  For example, if you have #ffffff vs #fffffe, the difference is 1
 -n dry run. Just output the new code at the end, rather than writing a file
 -b don't make a backup file (normally writes "filepath.orig")
 -f use highest match
Find color declarations and link them to color variable names
`

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "no-backup", "use-highest-match"],
  alias: {
    h: "help",
    e: "error",
    n: "dry-run",
    b: "no-backup",
    f: "use-highest-match"
  }
});

if (argv.help) {
  console.log(usage);
  process.exit();
}
const maxError = argv.error ? parseInt(argv.error, 10) : defaultMaxError;
const isDry = argv['dry-run'];
const noBackup = argv["no-backup"];
const useHighestMatch = argv["use-highest-match"];

const fs = require("fs-extra");
const path = require("path");
const prompt = require("prompt-sync")({
  sigint: true
});
const {parse, stringify} = require("scss-parser");
const createQueryWrapper = require("query-ast");

const devRoot = path.resolve(__dirname, '../..');
const reactkitPath = path.join(devRoot, 'reactkit');
const reactkitVariablesPath = path.join(reactkitPath, "src/css/_variables.scss");

const convertHexToNumbers = hex => {
  hex = String(hex);
  let hexParts;
  if (hex.length === 3) {
    hexParts = hex.split('').map(part => `${part}${part}`);
  } else if (hex.length === 6) {
    hexParts = [ hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)];
  } else {
    // i have no idea what this is...
    throw new Error(`Cannot convert ${hex} to a number`);
  }

  return hexParts.map(h => parseInt(h, 16));
}

const getReactkitColors = () => {
  const variablesAst = parse(fs.readFileSync(reactkitVariablesPath, "utf-8"));
  const $ = createQueryWrapper(variablesAst);

  const colors = {};
  $('declaration').get().forEach(dec => {
    const $dec = createQueryWrapper(dec);
    const colorName = $dec('property').find('variable').value();
    const colorHex = $dec('value').find('color_hex').eq(0).value();
    if (!colorHex) return;
    colors[colorName] = colorHex;
  })
  return colors;
}

const reactkitColors = getReactkitColors();
// console.log('Reactkit colors:');
// console.log(JSON.stringify(reactkitColors, null, 2));

const files = argv._;
if (!files.length) {
  console.error("Pass at least one filepath")
  process.exit(1);
}
files.forEach(filepath => {
  const ast = parse(fs.readFileSync(filepath, "utf-8"));
  const $ = createQueryWrapper(ast);

  // keep a history of the last hex values mapped to what name
  const lastHexToName = {};
  
  // find the ones with explicit hex values
  $('color_hex').replace(n => {
    const currentValue = n.toJSON().value;
    // console.log(`checking ${currentValue}`);
    //console.log(JSON.stringify(n.toJSON(), null, 2));
    let matches = [];
    const [cRed, cBlue, cGreen] = convertHexToNumbers(currentValue);
    Object.keys(reactkitColors).forEach(name => {
      const value = reactkitColors[name];
      const [rRed, rBlue, rGreen] = convertHexToNumbers(value);
      const redError = Math.abs(rRed - cRed);
      const blueError = Math.abs(rBlue - cBlue);
      const greenError = Math.abs(rGreen - cGreen);
      const totalError = redError + blueError + greenError;
      if (totalError > maxError) return;
      const maxPoints = maxError;
      const minPoints = 0;
      const points = -totalError + maxError;
      const weight = points / maxPoints;
      matches.push({
        weight,
        value,
        name
      })
    });
    matches.sort((a, b) => {
      if (a.weight === b.weight) return 0;
      return a.weight > b.weight ? -1 : 1;
    })
    let selectedMatch;
    if (matches.length) {
      if (matches[0].weight === 1) {
        const exactMatch = matches[0];
        console.log(`Replacing ${currentValue} with ${exactMatch.name} (perfect match)`)
        selectedMatch = exactMatch;
      } else {
        const lastNameChosen = lastHexToName[currentValue];
        let defaultValue;
        let message = '';
        message += "\n"
        message += `Select one of these matches to replace ${currentValue}:`
        matches.forEach((m,i) => {
          if (m.name === lastNameChosen) {
            defaultValue = i;
          }
          message += `${i}) ${m.value}: ${m.name} (${m.weight})`
        });
        if (useHighestMatch) {
          selectedMatchIndex = 0;
        } else {
          console.log(message);
          let ask = '';
          if (defaultValue !== undefined) {
            ask = `You chose ${lastNameChosen} last time. Press ENTER to use again. `;
          }
          let selectedMatchIndex = prompt(ask);
          if (selectedMatchIndex === '') {
            selectedMatchIndex = defaultValue;
          }
        }
        selectedMatch = matches[selectedMatchIndex];
      }
    }
    if (selectedMatch) {
      lastHexToName[currentValue] = selectedMatch.name;
      console.log('using', selectedMatch.name);
      // this actually has to return a variable node, not a color_hex
      return Object.assign(n.toJSON(), {
        type: 'variable',
        value: selectedMatch.name
      });
    }
    return n;
  });

  const newFile = stringify($().get(0));
  const backupFilePath = `${filepath}.orig`;
  if (isDry) {
    console.log();
    console.log('###', filepath);
    console.log(newFile);
    console.log();
  } else {
    fs.moveSync(filepath, backupFilePath, {overwrite: true});
    fs.writeFileSync(filepath, newFile);
    if (noBackup) {
      fs.unlinkSync(backupFilePath);
    }
  }
})