import _ from "lodash";
import { parseFileName } from "../src/tagParser.js";

import { readFileSync, writeFileSync } from "fs";

const answerFile = readFileSync("./answer.txt", "utf-8");

const answerList = new Map(
  answerFile
    .split("\n")
    .filter((line) => !line.match(/(夜桜|宵夜|桜都|脸肿|Maho\.sub)/))
    .map((line) => line.split("\t").reverse())
);

const rawAnswerList = new Map(
  answerFile
    .split("\n")
    .filter((line) => line.match(/(\[Ohys-Raws]|\[Leopard-Raws])/))
    .map((line) => line.split("\t").reverse())
);

const chineseAnswerList = new Map(
  answerFile
    .split("\n")
    .filter((line) =>
      line.match(
        /(\[Airota|\[BeanSub|\[CASO|\[Comicat|\[DHR|\[DMG|\[Dymy|\[EMD|\[FLsnow|\[FZSD|\[HKG|\[HYSUB|\[JYFanSUB|\[KNA|\[KTXP|\[Kamigami|\[LKSUB|\[Liuyun|\[Mabors|\[Mmch\.sub|\[Nekomoe|\[POPGO|\[Pussub|\[RH|\[Sakurato|\[SumiSora|\[TUcaptions|\[UHA-WINGS|\[WOLF|\[YUI-7)/
      )
    )
    .map((line) => line.split("\t").reverse())
);
let groups = [];
let allResult = [];

for (let file of chineseAnswerList.keys()) {
  let result = parseFileName(file);
  if (Math.random() <= 0.001) allResult.push(result);
  groups.push(...result.groups);
}

groups = _.uniqBy(groups, "raw");
groups = groups.filter((group) => {
  if (group.result == group.raw) return true;
});

writeFileSync("./testResult.json", JSON.stringify(allResult));

let resultTxt = "";
for (let file of allResult) {
  resultTxt = resultTxt + "\n" + file.rawFileName + "\n";
  for (let group of file.groups) {
    resultTxt = resultTxt + " " + JSON.stringify(group.result);
  }
  resultTxt = resultTxt + "\n" + file.title + " [" + file.episode + "]\n";
  for (let tag of file.tagedName) {
    if (typeof tag == "string") {
      resultTxt = resultTxt + tag + " ";
    }
    if (typeof tag == "object") {
      resultTxt = resultTxt + "[" + tag.result + "] ";
    }
  }
  resultTxt = resultTxt + "\n";
}

writeFileSync("./testResult.txt", resultTxt);
