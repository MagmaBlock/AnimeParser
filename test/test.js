import { parseFileName } from "../src/tagParser.js";

import { readFileSync, writeFileSync } from "fs";

const answerFile = readFileSync("./test/answer.txt", "utf-8");

const answerList = new Map(
  answerFile
    .split("\n")
    .filter((line) => !line.match(/(夜桜|宵夜|桜都|脸肿|Maho\.sub)/))
    .map((line) => line.split("\t").reverse())
);

let allResult = [];

for (let file of answerList.keys()) {
  if (Math.random() <= 1) allResult.push(parseFileName(file));
}

let resultTxt = "";
for (let file of allResult) {
  let thisResult = `${file.fileName}
发布组：${file.groups.map((group) => `[${group.result}]`)}
标题：<${file.animeTitle}>${file.animeYear ? ' ' + file.animeYear : ""} [${file.episode}]
noBrowser: ${file.noBrowser}
`;

  for (let tag of file.tagedName) {
    if (typeof tag == "string") {
      thisResult = `${thisResult}${tag} `;
    }
    if (typeof tag == "object") {
      thisResult = `${thisResult}[${tag.result}] `;
    }
  }
  resultTxt = resultTxt + thisResult + "\n\n";
}

writeFileSync("./test/testResult.txt", resultTxt);
