import _ from "lodash";
import aniep from "aniep";
import chineseParseInt from "chinese-parseint";

import dict from "../assets/tagsDict.js";

/**
 * 传入文件名，传出对此文件的解析结果
 * @param {String} fileName
 * @returns {Object}
 */
export function parseFileName(fileName) {
  if (!fileName) return null;

  let parseResult = {
    animeTitle: null,
    animeYear: null,
    episode: null,
    extensionName: null,
    fileName: fileName, // 原始文件名
    groups: [],
    videoSource: [],
    videoQuality: [],
    videoSubtitle: [],
    otherInfo: [],
    tagedName: [],
    noBrowser: false, // 不能在主流浏览器中播放
  };

  // 解析文件后缀名类型
  parseResult.extensionName = getExtensionName(fileName);
  // 如果是一个正常的带后缀的文件，将真名取出。如果没有，直接使用 fileName.
  let trueName = parseResult.extensionName?.trueName ?? fileName;

  /* 开始识别文件集数, 使用 aniep 库 */
  let thisEpisode = aniep(fileName);
  if (Array.isArray(thisEpisode)) {
    thisEpisode = `${thisEpisode[0]}-${thisEpisode[1]}`;
  }
  if (typeof thisEpisode == "string") {
    thisEpisode = thisEpisode.replace("|", "/");
  }
  if (typeof thisEpisode == "number") {
    thisEpisode = thisEpisode.toString();
  }
  parseResult.episode = thisEpisode;

  /* 开始匹配发布组 */
  // (?<=^\[).*?(?=\]) 匹配从文件名最开始 ^[|【   到首个 ]|】 之间的非换行字符串
  let firstBlock = trueName.match(/(?<=^(\[|【)).*?(?=(\]|】))/);
  if (firstBlock != null) {
    // 用 & 或 × 或 + 分割成数组
    firstBlock = firstBlock[0].split(/&|＆|×|\+/);
    // 遍历，匹配每个发布组词
    for (let groupName of firstBlock) {
      groupName = groupName.trim();
      let isGroup = matchGroupName(groupName);
      // 成功解析匹配到发布组
      if (typeof isGroup == "string") {
        parseResult.groups.push({
          result: isGroup,
          raw: groupName,
          type: "group",
        });
      }
      // 匹配失败，可能是词库中没有此发布组或首个 [] 并非发布组
      if (isGroup === null) {
        if (
          firstBlock.length == 1 &&
          (firstBlock[0].match(/ |\?|\!|,|？|！|，|。/) ||
            firstBlock[0].match(/ARTE|RideBack/i))
        ) {
          // 如果当前词匹配失败，且首个 [] 中仅分割出一个词，且这个词中还有空格逗号感叹号问号全角句号，那么首个 [] 极有可能不是发布组名而是作品名 (如 c.c动漫)
          // 如果满足此条件，进入当前 if，这时我们判断文件名中不存在发布组名，且这个块应该是作品标题.
          parseResult.animeTitle = firstBlock[0];
        } else {
          // 当前词应该是未能识别出的发布组，加入发布组列表
          parseResult.groups.push({
            result: groupName,
            raw: groupName,
            type: "group",
          });
        }
      }
    }
  }

  /* 处理非发布组部分 */
  // 将首个 [] 删除.
  let nameNoFirstBlock = trueName.replace(/^\[.*?\]/, "");
  nameNoFirstBlock = nameNoFirstBlock.split(/\[|\]|\(|\)| /); // 这次用 [ ] ( ) 还有空格拆开
  // 整理一下
  nameNoFirstBlock = _.concat(...nameNoFirstBlock); // 将零散的数组合并
  nameNoFirstBlock = tidyStringArray(nameNoFirstBlock); // trim 和删除空格

  // 删除无用词汇
  for (let i in nameNoFirstBlock) {
    let isGarbage = garbageCleaner(nameNoFirstBlock[i]);
    if (isGarbage) nameNoFirstBlock[i] = "";
  }
  // 移除上一个 for 产生的空字符串
  nameNoFirstBlock = tidyStringArray(nameNoFirstBlock);

  // 1. 第一次尝试：利用 aniep 找到的集数找出可能的标题文本
  if (parseResult.animeTitle === null && parseResult.episode !== null) {
    for (let i in nameNoFirstBlock) {
      // 找到集数的位置
      if (
        parseFloat(nameNoFirstBlock[i]) == parseResult.episode ||
        chineseParseInt(nameNoFirstBlock[i]) == parseResult.episode
      ) {
        let title = "";
        // 将发布组后，集数前的部分进行遍历
        for (let j in nameNoFirstBlock) {
          if (j == i) break; // 遍历到达集数位置，停止遍历
          if (
            nameNoFirstBlock[j].match(
              /(BD|Web|DVD)(Rip|-DL){0,1}|AVC|HEVC|((H|X).{0,1}(264|265))|1080P|720P|480P/i
            )
          )
            break; // fix some bad name
          if (nameNoFirstBlock[j].match(/(OVA|SP|OAD|NCOP|NCED|SONG)\d{0,3}/i))
            break; // OVA SP 等类型到达结尾
          if (nameNoFirstBlock[j].match(/^-|_&/)) continue; // 跳过符号词
          title = title + nameNoFirstBlock[j] + " ";
        }
        // 找到标题文本
        if (title) {
          parseResult.animeTitle = title;
          break; // 终止外层遍历避免后方再次出现和集数相同的数字
        }
      }
    }
  }

  // 判断 title 后，再拆开没拆开的 - 和 _
  let newArray = [];
  for (let word of nameNoFirstBlock) {
    if (typeof word == "string") {
      word = word.split(/\-|_/);
      newArray.push(...word);
    } else newArray.push(word);
  }
  // 整理一下
  nameNoFirstBlock = tidyStringArray(newArray); // trim 和删除空格

  // 遍历每个被分割的词汇，将他们替换为含有结果的对象，最有用的部分
  for (let i in nameNoFirstBlock) {
    console.log(nameNoFirstBlock[i]);
    let result = matchThisWord(nameNoFirstBlock[i]);
    nameNoFirstBlock[i] = result ?? nameNoFirstBlock[i];
    console.log(nameNoFirstBlock[i]);

    // 匹配成功时，除了将 tag 加入 tagedName, 还加入 parseResult 其他的分类的列表中
    if (result) {
      if (result.type == "source") {
        parseResult.videoSource.push(result);
      }
      if (result.type == "quality") {
        parseResult.videoQuality.push(result);
      }
      if (result.type == "subtitle") {
        parseResult.videoSubtitle.push(result);
      }
      if (result.type == "other") {
        parseResult.otherInfo.push(result);
      }
    }
  }

  parseResult.tagedName = [...parseResult.groups, ...nameNoFirstBlock];
  /*
    如果到达此处仍然没有找出 title，可能原因有：
    1. 当前文件只有一集，没有集数 (如剧场版、OVA)
    2. 使用了特殊的集数标记法，如 “第十二话”
    3. 其他意外情况

    下面再尝试补救一下
  */
  if (parseResult.animeTitle === null) {
    // 先检查一下 nameNoFirstBlock 中有没有 Object，如果没有，说明没有任何词典匹配成功，这个文件名很可能不是一个番剧视频名
    let hasObj = false;
    for (let ob of nameNoFirstBlock) {
      if (typeof ob == "object") {
        hasObj = true;
      }
    }
    // tag 匹配结果中有 Object，才使用下面的逻辑计算文件名
    if (hasObj) {
      // 从第一个 [] 之后开始向后遍历
      for (let word of nameNoFirstBlock) {
        // 遇到 Object 停止遍历, 通常是因为遇到了资源标识，说明标题已经结束
        if (typeof word != "string") {
          break;
        }
        // 抛弃标题中的横杠
        if (word.match(/^-|_$/)) {
          continue;
        }
        // 开始写标题
        if (parseResult.animeTitle === null) parseResult.animeTitle = "";
        parseResult.animeTitle = parseResult.animeTitle + word + " ";
      }
    }
  }

  // 优化一下结果
  if (parseResult.animeTitle) {
    parseResult.animeTitle = parseResult.animeTitle.trim();

    // 查找动画标题中可能存在的年份
    let animeYear = parseResult.animeTitle.match(/(19|20)\d\d/);
    if (animeYear) {
      parseResult.animeYear = animeYear;
    }
  }

  // 判断 noBrowser
  for (let tag of parseResult.tagedName) {
    if (typeof tag == "object") {
      if (tag.noBrowser) {
        parseResult.noBrowser = true;
        break;
      }
    }
  }

  return parseResult;
}

/**
 * 传入一个词 判断是否为一个发布组。如果不是将返回 null
 * @param {String} word
 * @returns {String | null}
 */
function matchGroupName(word) {
  // 遍历此词典的内容
  for (let group of dict.group) {
    let thisDictRegExp = group.from;
    let thisDictResult = group.to;
    let thisWordReplaced = word.replace(thisDictRegExp, "").trim();
    if (!thisWordReplaced) {
      return thisDictResult;
    }
  }

  return null; // 什么也没匹配到
}

/**
 * 传入拆分后的词 返回匹配结果或 null
 * @param {String} word
 * @returns {String | Object | null}
 */
function matchThisWord(word) {
  let dictUsed = ["source", "quality", "subtitle", "other"];
  // 遍历使用的词典列表
  for (let dictName of dictUsed) {
    let thisDict = dict[dictName]; // 此词典内容
    // 遍历此词典的内容
    for (let thisRule of thisDict) {
      // 如果正则将传入的 word 完全替换掉了，说明匹配成功。这时 thisWordReplaced 为 true
      let thisWordReplaced = !word.replace(thisRule.from, "").trim();
      // 匹配成功的逻辑
      if (thisWordReplaced) {
        let result = {
          result: thisRule.to,
          raw: word,
          type: dictName,
        };
        if (thisRule.noBrowser) {
          result.noBrowser = true;
        }
        return result;
      }
    }
  }
  return null; // 什么也没匹配到
}

/**
 * 清理垃圾，用 delete 规则删除没用的词（一般是广告）
 * @param {String} word
 * @returns {Boolean} 是否为垃圾词
 *
 */
function garbageCleaner(word) {
  // 清理垃圾，用 delete 规则删除没用的词
  let garbageDict = dict.delete; // 垃圾正则
  for (let i in garbageDict) {
    // 遍历此词典的内容
    let thisDictRegExp = garbageDict[i];
    let thisWordReplaced = word.replace(thisDictRegExp, "").trim();
    if (!thisWordReplaced) {
      return true;
    }
  }
  return false; // 什么也没匹配到，不是垃圾
}

/**
 * 解析文件后缀名类型
 * @param {String} fileName
 * @returns {Object | null}
 */
function getExtensionName(fileName) {
  // 获取拓展名
  let splitedFileName = fileName.split(".");
  let lastOne = _.last(splitedFileName);
  let trueName = fileName.replace(new RegExp("(.*)\\." + lastOne, "i"), "$1"); // 移除后缀名的文件名
  for (let i in dict.format) {
    let thisDict = dict.format[i];
    let matched = lastOne.replace(thisDict.from, "").trim();
    if (!matched) {
      return {
        result: thisDict.to,
        type: thisDict.type,
        raw: lastOne,
        trueName: trueName,
      };
    }
  }
  if (lastOne.length <= 5) return { raw: lastOne, trueName: trueName };
  else return null;
}

function tidyStringArray(list) {
  // 传入一个字符串列表，返回 trim 和删除假值后的结果
  for (let i in list) list[i] = list[i].trim(); // 去除首尾空格
  return _.compact(list); // 删除所有空格和假值
}
