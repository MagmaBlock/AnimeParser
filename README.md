# AnimeParser
解析日本动画视频的文件名为 JavaScript Object 或可标签化显示的数组。

Parsing Japan anime video's name to JavaScript Object or array of tagged name which can be displayed.

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
