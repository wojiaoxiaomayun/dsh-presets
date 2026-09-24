# dsh-presets

DeepSeek Harness (DSH) 鐨勮嚜鐢?Agent 棰勮锛坅gent presets锛夐泦鍚堛€?
> **v2 杩佺Щ璇存槑锛堥噸瑕侊級**锛欴SH 宸茬粡涓嶅啀璇诲彇 `.agent-presets/<id>/` 杩欑銆屼竴涓洰褰?+ `preset.yml` + `agent.cordis.yml`銆嶇殑鏃ф牸寮忛璁俱€?> 鐜板湪涓€涓璁炬槸**涓€鏉?`@deepseek-ai/dsh-agent-preset` 澹版槑琛?*锛岀敱**涓€涓?bundle 鐨?patch 鏂囦欢**鎼哄甫锛岄€氳繃 `plugin_manager` 瀹夎銆?> 鏃х洰褰曟牸寮忕幇鍦ㄤ笉浼氳浠讳綍浠ｇ爜璇诲彇锛屾墍浠ュ崌绾у悗鏃ч璁句細**闈欓粯娑堝け**銆傛湰浠撳簱宸茶縼绉诲埌鏂版牸寮忋€?
## 鍖呭惈鐨勯璁?
| 鐩綍 | 棰勮鍚?| 璇存槑 |
| --- | --- | --- |
| [`codebuddy-preset/`](codebuddy-preset/) | CodeBuddy 妯″紡 | 浠?CodeBuddy 鐨勭郴缁熸彁绀鸿瘝浣滀负浜烘牸銆侀潰鍚戙€屽钩鏃舵敼鏀逛唬鐮併€嶈鍓繃鐨勫崟鏅鸿兘浣撶紪鐮侀璁俱€備繚鐣欐枃浠惰鍐欍€佹绱€丼hell銆佸悗鍙颁换鍔°€丼kills銆佷换鍔℃竻鍗曘€佷氦浜掍笌浜や粯锛?*宸茬鐢?*锛歚tool-web`锛坵eb_fetch / web_search锛夈€佺洰鏍囨ā寮忥紙`command-goal` / `tool-goal`锛夈€佽鍒掓ā寮忥紙`planning` 缁勶級銆佷互鍙婃暣涓?delegation 缁勶紙`subagent` / `subagent_fork` / `send_message` / `interrupt_agent` / `list_agents` / `workflow` / `ralph`锛夈€傚熀浜庡畼鏂?`standard` 棰勮鏀瑰啓銆傚彟鍚竴閬?*闅惧害闂ㄧ**锛堣涓嬶級銆?|

## 缁撴瀯

```
.
鈹溾攢鈹€ README.md
鈹斺攢鈹€ codebuddy-preset/                 # 鈫?涓€涓?bundle锛屽氨鏄竴涓璁?    鈹溾攢鈹€ package.json                  # 澹版槑 dsh.bundle.patch 鎸囧悜涓嬮潰鐨?patch
    鈹溾攢鈹€ cordis.patch.yml              # 棰勮澹版槑锛歩d / name / description / order / plugins
    鈹溾攢鈹€ shadow-surface-sections.mjs   # 閬斀涓や釜瀹夸富鍏ㄥ眬鎻愮ず璇嶆钀斤紙瑙佷笅锛?    鈹斺攢鈹€ difficulty-policy.mjs         # 闅惧害闂ㄧ锛氳瘎鍒嗐€佸姩鎬侀槇鍊笺€?difficulty 鍛戒护锛堣涓嬶級
```

涓€涓?bundle 鍙渶瑕?`package.json` 閲岀殑涓€娈靛０鏄庯紝鍛婅瘔 DSH 鐢ㄥ摢涓枃浠朵綔涓?patch锛?
```json
{
  "name": "@dsh-xhl/dsh-codebuddy-preset",
  "version": "2.0.0",
  "private": false,
  "type": "module",
  "exports": {
    "./shadow-surface-sections.mjs": "./shadow-surface-sections.mjs",
    "./difficulty-policy.mjs": "./difficulty-policy.mjs",
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./package.json": "./package.json"
  },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "files": [
    "cordis.patch.yml",
    "shadow-surface-sections.mjs",
    "difficulty-policy.mjs",
    "README.md"
  ]
}
```

瑕佺偣锛?
- **`dsh.bundle.patch`** 鏄?DSH 璇嗗埆 bundle 鐨勫敮涓€渚濇嵁锛屽繀椤绘寚鍚?patch 鏂囦欢銆?- **`files`** 鍐冲畾 npm 鍙戝寘鏃跺甫涓婁粈涔堛€傛紡鍐欎細鎶婃彃浠舵枃浠舵紡鎺夛紝瑁呭畬灏辨姤 `never started`銆傜敤 `npm pack --dry-run` 鏍稿銆?- **`exports`** 鏆撮湶涓や釜 `.mjs` 瀛愯矾寰勨€斺€旈璁捐鍙兘鐢ㄥ寘鍚嶅鍧€锛屼笉鑳界敤 `./x.mjs`锛堝師鍥犺涓嬶級銆?- **`private: false`** + `publishConfig.access: "public"`锛坰cope 鍖呴粯璁ょ鏈夛紝涓嶅啓鍙戜笉鍑哄幓锛夈€?
鑰?`cordis.patch.yml` 灏辨槸涓€鏉?`insert`锛?
```yaml
- insert:
    - id: preset-codebuddy            # Loader 琛?id锛岀害瀹氫负 preset-<preset id>
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: codebuddy                 # 棰勮韬唤锛屼細璇濇寜瀹冭浣忔墍鐢ㄩ璁?        name: CodeBuddy 妯″紡           # 閫夋嫨鍣ㄩ噷鐨勬樉绀哄悕
        order: 3                      # 鍚嶅崟鎺掑簭
        plugins: [...]                # 瀛愭彃浠惰鍒楄〃锛堝伐鍏枫€佷汉鏍笺€佹钀解€︹€︼級
```

## 瀹夎

### 浠?npm 瀹夎锛堟帹鑽愶紝鍙戝竷鍚庯級

```bash
dsh plugin --profile web add @dsh-xhl/dsh-codebuddy-preset
```

涔熷彲浠ョ敤 `plugin_manager` 宸ュ叿瀹夎锛歚action: install_bundle`锛宍target` 濉?`@dsh-xhl/dsh-codebuddy-preset`銆?
### 浠庢湰鍦扮洰褰曞畨瑁咃紙寮€鍙戠敤锛?
`target` 鎸囧悜 bundle 鐩綍鐨?*缁濆璺緞**锛?
```powershell
plugin_manager(action: "install_bundle", target: "F:\AgentWork\dsh-presets\codebuddy-preset")
```

瀹冭嚜宸变細瀹屾垚渚濊禆瀹夎涓?bundle 鍚敤锛?*涓嶉渶瑕?*鎵嬪伐璺?`pnpm`銆?
> **涓嶈**鍐嶇敤澶嶅埗鐩綍鍒?`$DSH_HOME/.agent-presets/` 鐨勬柟寮忊€斺€旈偅鏍疯鍑烘潵鐨勯璁句笉浼氳浠讳綍浠ｇ爜璇诲彇銆?
瀹夎鍚?*鍒锋柊椤甸潰**锛屽湪鏂板缓浼氳瘽鐨勯€夋嫨鍣ㄤ腑鍗冲彲鐪嬪埌璇ラ璁撅紙鏄剧ず鍚嶆潵鑷?`config.name`锛屽銆孋odeBuddy 妯″紡銆嶏級锛屼篃鍙互鎶婂畠璁句负榛樿棰勮銆?
## 楠岃瘉

```powershell
plugin_manager(action: "list_bundles")     # 搴斿嚭鐜?@dsh-xhl/dsh-codebuddy-preset
plugin_manager(action: "list_plugins")     # 搴斿嚭鐜?preset-codebuddy 琛?```

`preset-codebuddy` 琛屼細闅忓叾鎵€鍦?bundle 涓€璧疯嚜鍔ㄥ嚭鐜般€傚垽鏂畠鏄惁**鐪熸鍙敤**锛岀湅瀹冪殑 fiber 闃舵鏄惁涓?`active`锛?
- 鎸傝浇澶辫触鐨勮浼?*鐣欏湪鍚嶅崟涓?*骞堕檮甯﹀け璐ュ師鍥狅紙涓嶄細闈欓粯娑堝け锛夛紝鐓у師鍥犱慨濂藉悗閲嶆柊瀹夎鍗冲彲銆?- 宸插瓨鍦ㄧ殑浼氳瘽涓庡叾瀛愪唬鐞嗕繚鐣欏畠浠惎鍔ㄦ椂鐨勯偅浠芥彃浠剁増鏈紱鏀瑰姩鍚庤鍦?*鏂颁細璇?*閲岄獙璇併€?
鍙戝寘鍓嶅缓璁厛鑷涓€娆★紝纭鎵€鏈夎閮借兘琚В鏋愶細

```powershell
cd codebuddy-preset
npm pack --dry-run        # 纭 files 鍒楄〃閲?4 涓枃浠堕兘鍦?```

## 鍙戝竷鍒?npm

```bash
cd codebuddy-preset
npm version patch          # 鎴?minor / major
npm publish                # scope 鍖呴渶瑕?publishConfig.access=public锛堝凡閰嶇疆锛?```

鍙戝竷鍚庯紝浠讳綍浜鸿繖鏍疯锛?
```bash
dsh plugin --profile web add @dsh-xhl/dsh-codebuddy-preset
```

鍙戝竷娉ㄦ剰浜嬮」锛?
- **鐗堟湰鍙峰繀椤婚€掑**锛宯pm 涓嶅厑璁歌鐩栧凡鍙戝竷鐗堟湰銆?- `files` 婕忓啓浼氬皯鍙戞枃浠讹紝瑁呬笂灏辨姤 `never started`鈥斺€斿彂甯冨墠鐢?`npm pack --dry-run` 鏍稿銆?- 鍙戝竷鍚?`node_modules` 閲屾槸**鐪熷疄鍓湰**锛堜笉鏄紑鍙戞椂鐨勮蒋閾炬帴锛夛紝鎵€浠ラ璁捐缁濅笉鑳界敤 `./` 鐩稿璺緞锛屽繀椤荤敤鍖呭悕銆?- 鍖呭悕涓€鏃﹀彂甯冨氨**涓嶈兘鏀?*锛堟敼鍖呭悕绛変簬鍙戞柊鍖咃紝鑰佺敤鎴蜂笉浼氭敹鍒版洿鏂帮級銆?
## 浣跨敤

- 浼氳瘽鍒涘缓鏃堕€夊畾 preset锛涘彧鏈夌┖浼氳瘽鍙互鍒囨崲 preset銆?- 鍔犲叆鍚屼竴 preset 鐨勪細璇濆叡浜竴浠藉凡瑁呰浇鐨勭粍瑁咃紝瀛愪唬鐞嗭紙subagent锛夌户鎵跨埗鏂圭殑缁勮锛堝湪鏈璁鹃噷 delegation 缁勬槸鍏虫帀鐨勶紝鎵€浠ヤ笉浼氭湁瀛愪唬鐞嗭級銆?- 缁勮鐨勫姞杞介敊璇笉浼氳闅愯棌锛氭棤娉曞姞杞界殑 preset 浼氬湪閫夋嫨鍣ㄤ腑杩炲悓鍘熷洜涓€骞跺垪鍑猴紝鏂逛究瀹氫綅淇鎴栧垹闄ゃ€?
## 鑷畾涔?
- 鐩存帴缂栬緫 `codebuddy-preset/cordis.patch.yml` 鍗冲彲璋冩暣璇ラ璁剧殑宸ュ叿涓庢彁绀鸿瘝锛屾瘡涓閮芥湁娉ㄩ噴璇存槑鍏朵綔鐢ㄤ笌鎵€鍦?realm 鐨勫彇鑸嶇悊鐢便€傛敼瀹?*閲嶆柊瀹夎涓€娆¤ bundle**锛坄install_bundle` 鍙噸澶嶆墽琛岋級骞跺埛鏂伴〉闈€?- 鑻ヨ鎭㈠ `web_fetch` / `web_search`锛屾妸 `tool-web` 閭ｄ竴琛岀殑 `disabled: true` 鍘绘帀锛堟垨鏁磋鍒犻櫎锛夈€侶ost 鐨?`web` 鏈嶅姟涓庢悳绱㈡彁渚涙柟鍦ㄥ涓诲钩闈紝棰勮鍙渶寮€鏀炬ā鍨嬩晶宸ュ叿銆?- 鑻ヨ鎭㈠ delegation 缁勶紙`subagent` / `subagent_fork` / `workflow` / `ralph` 绛夛級锛屽幓鎺?`delegation` 缁勯偅涓€琛岀殑 `disabled: true` 鍗冲彲锛涚粍鍐呬袱涓彲閫?provider 琛岋紙codex / claude-code锛変粛鍚勮嚜淇濇寔绂佺敤銆?- **鏂板棰勮**锛氬鍒?`codebuddy-preset/` 鐩綍锛屾敼 `package.json` 閲岀殑 `name`锛屾敼 patch 閲岀殑 `id` / `config.id` / `config.name`锛坄config.id` 蹇呴』鍞竴锛岄噸澶嶄細瀵艰嚧澹版槑鍔犺浇澶辫触锛夈€?
> 鑷缂栧啓鐨勯璁捐瑙嗕负**鍙椾俊浠婚厤缃?*锛氬畠浼氭巿浜堟墍閫夋彃浠剁殑鍏ㄩ儴鑳藉姏锛屼笖瀹夎 bundle 浼氬湪 Host 杩涚▼閲屾墽琛屾彃浠朵唬鐮併€傝鍙湪鍙俊鏈哄櫒涓婁娇鐢ㄣ€?
## 闅惧害闂ㄧ

`codebuddy` 甯︿竴閬?*闅惧害闂ㄧ**锛氭ā鍨嬪湪鍔ㄦ墜鏀规枃浠跺墠鍏堟妸浠诲姟闅惧害璇勪负 **0鈥?0 鍒?*锛堥€氳繃 `report_task_difficulty` 宸ュ叿锛岄檮涓€鍙ュ彲鏍稿鐞嗙敱锛夛紝骞朵笌闃堝€兼瘮杈冦€?
- **鍒嗘暟 鈮?闃堝€?*锛氱収甯稿伐浣滐紝璇ヨ窇娴嬭瘯銆佽鏋勫缓灏辩収鍋氥€?- **鍒嗘暟 < 闃堝€?*锛氬疄鐜板畬**鐩存帴浜や粯**鈥斺€斾笉璺戞祴璇曞浠躲€佷笉鍐欐祴璇曟枃浠躲€佷笉鍋氶澶栭獙璇併€佷篃涓嶅弽闂涓嶈楠岃瘉锛屽苟鍦ㄦ渶缁堝洖澶嶄腑璇存槑銆屽洜浣庝簬闃堝€艰烦杩囦簡楠岃瘉銆嶄互鍙婂垎鏁颁笌闃堝€笺€?
杩欐牱骞虫椂鐨勫皬鏀瑰姩涓嶇敤鍐嶇瓑涓€杞祴璇曘€傝瘎鍒嗛敋鐐癸紙鎻愮ず璇嶉噷缁欐ā鍨嬬殑鏍囧噯锛屼篃鏄悊鐢辫瀵圭収鐨勬爣灏猴級锛?
| 鍒嗘暟 | 閫傜敤鍦烘櫙 |
| --- | --- |
| 0鈥? | 鏀逛竴琛屻€侀敊鍒瓧銆佸崟涓樉鑰屾槗瑙佺殑鍊?|
| 3鈥? | 鍗曟枃浠跺唴鐨勫皬鑼冨洿鏀瑰姩銆佹湁杈圭晫鐨?bug 淇銆侀厤缃井璋?|
| 5鈥? | 璺ㄨ嫢骞叉枃浠剁殑鏀瑰姩锛屾垨杈圭晫娓呮櫚鐨勫皬鍔熻兘 |
| 7鈥? | 璺ㄦā鍧楁敼鍔ㄣ€佹秹鍙婂澶勮皟鐢ㄧ偣鐨勯噸鏋勩€佹柊瀛愮郴缁?|
| 9鈥?0 | 杩佺Щ銆佸苟鍙戙€佸崗璁垨鏁版嵁鏍煎紡鍙樻洿銆佸畨鍏ㄦ晱鎰熴€佹垨闅句互鎾ら攢鐨勫伐浣?|

闃堝€奸粯璁?**4**锛?*姣忎釜浼氳瘽鍚勮嚜涓€浠?*锛屽彲浠ラ殢鏃跺湪浼氳瘽鍐呮敼锛?
```
/difficulty          # 鏌ョ湅鏈細璇濈殑闃堝€间笌鏈浠诲姟鐨勮瘎鍒?/difficulty 7        # 鎶婃湰浼氳瘽鐨勯槇鍊兼敼涓?7
/difficulty reset    # 鎶婃湰浼氳瘽鎭㈠涓洪粯璁ゅ€?```

`/difficulty` 鍙帴鍙?**0鈥?0 鐨勬暣鏁?*锛堜笉鍥涜垗浜斿叆锛宍7.5` 鐩存帴鎶ラ敊锛夋垨 `reset`锛涚渷鐣ュ弬鏁板嵆鏌ョ湅褰撳墠鐘舵€併€傛敼鍔?*鍙奖鍝嶅綋鍓嶄細璇?*锛屼笉鍐欑鐩樸€佷笉浼氫覆鍒板叾瀹冧細璇濄€佷細璇濈粨鏉熷悗鍗虫秷澶憋紱鏂颁細璇濅竴寰嬩粠 patch 閲岄偅涓€琛岀殑 `config.threshold` 寮€濮嬶細

```yaml
- id: difficulty-policy
  name: './difficulty-policy.mjs'
  config:
    threshold: 4
```

`config.threshold` 缂哄け鎴栦笉鏄?0鈥?0 鐨勬暟鍊兼椂锛屽洖閫€鍒板唴缃粯璁ゅ€?**4**銆傛病鏈夊懡浠ょ晫闈㈢殑閮ㄧ讲锛坔eadless / ACP锛夐噷涓嶆敞鍐?`/difficulty`锛屼絾闂ㄧ鐨勬彁绀鸿瘝涓?`report_task_difficulty` 宸ュ叿鐓у父鐢熸晥銆?
> 娉ㄦ剰锛氬垎鏁扮敱妯″瀷鑷瘎銆傞棬绂佷細瑕佹眰瀹冪粰鍑虹悊鐢憋紝涓旀彁绀鸿瘝鏄庣‘銆屽瓨鐤戞椂寰€涓婃墦鍒嗐€嶏紝浣嗘ā鍨嬩粛鍙兘浣庝及闅惧害鈥斺€斾綆鍒嗘剰鍛崇潃杩欐浜や粯**鏈粡浠讳綍楠岃瘉**锛岄闄╃敱浣犳壙鎷呫€傛兂鍏虫帀鏁撮亾闂ㄧ锛屽垹鎺?`difficulty-policy` 閭ｄ竴琛屽嵆鍙€?>
> 棰勮鏄€屾瘡涓細璇濆姞鍏ュ悓涓€浠界粍瑁呫€嶏紝鎵€浠ラ槇鍊间笌璇勫垎閮芥寜浼氳瘽锛坅gent锛夊垎鍒瓨鍌紝骞跺湪浼氳瘽缁撴潫鏃跺洖鏀讹紱杩欎篃鏄畠**涓嶈惤鐩?*鐨勫師鍥犫€斺€旀病鏈変竴浠藉叏灞€閰嶇疆鍙互琚埆鐨勪細璇濇垨涓嬫鍚姩璇诲埌銆?
## 涓や釜鑷甫鎻掍欢

涓や釜 `.mjs` 閮芥槸棰勮鑷甫鐨勫井鍨嬫彃浠讹紝閮?*涓嶅彂甯冧换浣曟湇鍔?*锛屽洜姝ゆ棤闇€ `isolate` realm銆?
> **鍏抽敭鍧戯紙鍔″繀璁颁綇锛?*锛氶璁捐閲岀殑 `./xxx.mjs` **涓嶆槸**鐩稿 patch 鏂囦欢瑙ｆ瀽鐨勩€?> `dsh-agent-preset-registry` 鍦ㄨ杞介璁炬椂浼氱敤**澹版槑鏂?*鐨?`baseUrl` 閲嶆柊鎸傝浇棰勮瀛愭爲锛岃€岄偅涓?`baseUrl` 鏄?**profile 鐩綍**锛坄<profile>/cordis.yml`锛夈€?> 鎵€浠?`./shadow-surface-sections.mjs` 浼氳瑙ｆ瀽鎴?`<profile>/shadow-surface-sections.mjs`鈥斺€旀枃浠朵笉瀛樺湪锛岃琛屽氨浠?> `shadow-surface-sections (./shadow-surface-sections.mjs): never started` 澶辫触銆?>
> 姝ｇ‘鍐欐硶鏄?*鐢ㄥ寘鍚?*锛坄package.json` 鐨?`exports` 鏆撮湶杩欎袱涓枃浠讹級锛屽洜涓哄寘鍚嶄細璧?profile 鐨?`node_modules`锛?> 鑰屾湰 bundle 姝ｆ槸杞摼鎺ュ湪閭ｉ噷锛?>
> ```yaml
> - id: shadow-surface-sections
>   name: '@dsh-xhl/dsh-codebuddy-preset/shadow-surface-sections.mjs'
> - id: difficulty-policy
>   name: '@dsh-xhl/dsh-codebuddy-preset/difficulty-policy.mjs'
> ```

涓や釜鏂囦欢閮藉埢鎰忎繚鎸?*闆朵緷璧?*锛堣繛 `node:*` 閮戒笉鐢級锛氬畠浠粠 profile 閲屽姞杞斤紝鍚戜笂鎵?`node_modules` 鍒颁笉浜?`@deepseek-ai/*`銆?
`shadow-surface-sections.mjs` 鐨勪綔鐢ㄦ槸**瀵规湰棰勮鐨?agent 灞忚斀涓や釜鍏ㄥ眬鎻愮ず璇嶆钀?*锛?
- `harness:source` 鈥斺€?鐢?`dsh-app-boot` 娉ㄥ唽锛岃鏄?DSH 鑷韩瀹夎鐩綍鍦ㄥ摢
- `app:web-surface` 鈥斺€?鐢?`dsh-web-app` 娉ㄥ唽锛學eb GUI 鐨勬柟浣嶈鏄庯紙鍚綋鍓?`dsh web` 鍦板潃锛?
杩欎袱娈?*涓嶆槸鍙鐢ㄧ殑琛?*锛岃€屾槸鍦?`dsh-web-app` 鐨?`apply()` 鍐呴儴鏃犳潯浠舵敞鍐岀殑锛屼笖娉ㄥ唽鏃舵病鏈変綔鐢ㄥ煙锛屽洜姝ゆ槸杩涚▼绾у叏灞€銆佹瘡涓璁鹃兘浼氬甫涓娿€傚睆钄藉師鐞嗭細鎻愮ず璇嶆敞鍐岃〃鎸変綔鐢ㄥ煙閾惧悎骞舵钀斤紝鍚屽悕鏃?*鏈€杩戠殑浣滅敤鍩熻鐩栧叏灞€**锛岃€屾覆鏌撴椂**绌烘枃鏈钀借涓㈠純**鈥斺€旀墍浠ヤ粠棰勮浣滅敤鍩熸敞鍐屽悓鍚嶇┖娈佃惤鍗冲彲绉婚櫎锛屼笖鍙奖鍝嶆湰棰勮銆傝繖涓?`dsh-persona` 閬斀 `deployment:persona-prefix` 鏄悓涓€鏈哄埗銆傚垹鎺夐偅涓€琛屽嵆鍙仮澶嶄袱娈点€?
`difficulty-policy.mjs` 鐨勫疄鐜拌鐐癸細

- **闆?import**锛堣繛 `node:*` 閮戒笉鐢級銆傞槇鍊兼潵鑷琛岀殑 `config.threshold`鈥斺€擟ordis 鍦ㄦ彃浠?*鏈鍑?`Config` schema** 鏃跺師鏍烽€忎紶 config锛岃繖姝ｆ槸闆朵緷璧栨枃浠朵篃鑳芥帴鍙楅厤缃€佷笖涓嶅繀鑷繁璇诲啓鏂囦欢鐨勫師鍥犮€?- 宸ュ叿鐢?*绾璞?*娉ㄥ唽锛坄ctx.tools.register({...})`锛夛紝鍥犱负 `defineTool()` 闇€瑕?import `@deepseek-ai/dsh-tools`銆?- 绛栫暐姝ｆ枃璧?`systemPrompt.section()`锛堝浐瀹氭枃鏈紝淇濅綇 KV 鍓嶇紑锛夛紝闃堝€间笌璇勫垎璧?`systemPrompt.context()`锛堟瘡姝ラ噸鏂版眰鍊笺€佹寜浼氳瘽鍙栧€硷紝涓斾綔涓?user message 杩藉姞锛屼笉浼氬嚮绌垮墠缂€锛夈€?- **鎵€鏈夌姸鎬佹寜浼氳瘽锛坅gent锛夊垎鍒瓨鍌?*锛氶璁惧彧鎸傝浇涓€娆★紝妯″潡绾у彉閲忎細琚墍鏈変細璇濆叡浜紝鎵€浠ユ瘡娆¤鍙栭兘浠ュ綋鍓?agent 涓洪敭銆俙/difficulty` 鍙敼璋冪敤瀹冪殑閭ｄ釜浼氳瘽銆傝褰曞湪 `agent/disposed` 鏃跺洖鏀垛€斺€斿畠涓嶄細姣忎釜浼氳瘽鐣欎竴鏉℃案涓嶉噴鏀剧殑鏉＄洰銆?- `commands` 璧?`ctx.get('commands')` 鍙€夎В鏋愯€岄潪 `inject`锛氭病鏈夊懡浠ょ晫闈㈢殑閮ㄧ讲锛坔eadless / ACP锛夐噷锛岃繖閬撻棬绂佺殑鎻愮ず璇嶄笌宸ュ叿鐓у父鐢熸晥锛屽彧鏄病鏈?`/difficulty`銆?
## 涓庡畼鏂?`standard` 棰勮鐨勫樊寮?
鏈璁剧殑鎻掍欢鍒楄〃鏄収 `@deepseek-ai/dsh-web-app` 0.1.7-alpha.1 鐨?`presets/standard.patch.yml` 閲嶅啓鐨勶紝宸紓鍙湁锛?
1. `persona` 鎹㈡垚 CodeBuddy 鐨勬彁绀鸿瘝锛?2. 澧炲姞 `shadow-surface-sections`锛堟湰棰勮涓撳睘锛夛紱
3. 澧炲姞 `difficulty-policy`锛堟湰棰勮涓撳睘锛夛紱
4. 绂佺敤 `tool-web`銆乣command-goal`銆乣tool-goal`銆乣planning`銆乣delegation`銆?
閲嶅啓鏃跺悓鏃朵慨姝ｄ簡鏃ф枃浠堕噷涓€澶?*宸查殢鐗堟湰鏀瑰悕銆佹棫鏂囦欢娌¤窡涓?*鐨勫寘鍚嶏紙瀹冨湪琚鐢ㄧ殑 `delegation` 缁勫唴锛屾墍浠ヤ笉褰卞搷鏈璁捐涓猴紝浣嗕竴鏃︽湁浜洪噸鏂板惎鐢ㄨ缁勫氨浼氱偢锛夛細

- `workflow-ptc`锛堟棫鍚?`@deepseek-ai/dsh-workflow-worker-thread`锛岃鍖呭凡涓嶅瓨鍦級

> 娉ㄦ剰锛氭瘡涓彃浠惰**閮藉繀椤绘湁 `name`**鈥斺€斿寘鎷?`id: present` 杩欑銆岃 id 鐪嬭捣鏉ュ氨鍍忓寘鍚嶃€嶇殑琛岋紝瀹冪殑 `name` 浠嶆槸 `@deepseek-ai/dsh-tool-present`銆?> 灏戝啓 `name` 浼氬湪澹版槑鍔犺浇鏃舵姤 `row N names no plugin (a "name" string is required)`銆?
## 鐩稿叧

- [DSH Agent 棰勮鏂囨。锛坉sh-agent-presets锛塢(https://github.com/deepseek-ai/dsh) 鈥斺€?棰勮鐨勫０鏄庛€佸彂鐜颁笌鎸変細璇濈粍瑁呮満鍒躲€?