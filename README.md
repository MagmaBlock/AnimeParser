# ⚠️ Deprecated

This package has been archived and will not be maintained.
You can use anime-name-tool instead.

此库已被归档，将不会再维护。
你可以使用 anime-name-tool 来代替。

# AnimeParser

Parses the filename of Japanese anime video into JavaScript object or an array of tagged names, which can be beautifully displayed.

解析日本动画视频的文件名为 JavaScript Object 或可标签化显示的数组。

# Usage

```js
import parseFileName from 'index.js'

parseFileName('[MingY&LavaAnimeSub] Onii-chan wa Oshimai! [11][1080p][CHS&JPN].mp4')
```

```js
// Result:

{
  animeTitle: 'Onii chan wa Oshimai!',
  animeYear: null,
  episode: 11,
  extensionName: {
    result: 'MP4视频',
    type: 'video',
    raw: 'mp4',
    trueName: '[MingY&LavaAnimeSub] Onii-chan wa Oshimai! [11][1080p][CHS&JPN]'
  },
  fileName: '[MingY&LavaAnimeSub] Onii-chan wa Oshimai! [11][1080p][CHS&JPN].mp4',
  groups: [
    { result: 'MingYSub', raw: 'MingY', type: 'group' },
    { result: '熔岩动画Sub', raw: 'LavaAnimeSub', type: 'group' }
  ],
  videoSource: [],
  videoQuality: [ { result: '1080P', raw: '1080p', type: 'quality' } ],
  videoSubtitle: [],
  otherInfo: [],
  tagedName: [
    { result: 'MingYSub', raw: 'MingY', type: 'group' },
    { result: '熔岩动画Sub', raw: 'LavaAnimeSub', type: 'group' },
    'Onii',
    'chan',
    'wa',
    'Oshimai!',
    '11',
    { result: '1080P', raw: '1080p', type: 'quality' },
    { result: '简日双语', raw: 'CHS&JPN', type: 'subtitle' }
  ],
  noBrowser: false
}
```
