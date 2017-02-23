### TODOs
| Filename | line # | TODO
|:------|:------:|:------
| module.js | 4 | should release minified (.min.js) and not (.js)
| services/Files.js | 7 | Remove useless injections
| services/Polls.js | 12 | Should be meuAPIServices agnostic
| lib/Files.js | 170 | is loading localStorage['files] for each media, should be optimized to only load once for all
| lib/Files.js | 257 | If status is downloaded but local file is missing then return FALSE