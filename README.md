# Anki-Spanish-Creator

I created this project to save time while uploading spanish vocab into [anki](https://apps.ankiweb.net/), a spaced-repetition learning software tool.  This will bulk-create spanish works into a learning deck, meant to save a ton of time (the UI would take much longer).  Features include:
  - automatically creates anki double-sided cards using anki connect
  - auto-fetches pronunciation mp3 of spanish word from spanishdict.com
  - Web crawls and fetches sample sentences using chrome headless browser, from spanishdict.com

Sample url for pronunciation is something like:  `https://audio1.spanishdict.com/audio?lang=es&text=hablar&key=494e1f0d93abd4cffaa8d5781d05dd9c`

Updates 8/7/19 - can now add a JSON or CSV file, code will handle either case.  CSV is kind of unnecessary complications, and then it wasn't possible to parse out comma from part of translation.


### Instructions

1. Put words you'd like to learn into a csv or json file under `words` directory.  See csv-parser section below for more info.
2. Make sure anki is running locally, with anki connect plugin installed (https://ankiweb.net/shared/info/2055492159)
3. `docker-compose up -d` which will spin up a local RMQ, and expose management port to port `8080`.  Open `localhost:8080` in browser to see management UI, with default creds of `guest` for both `username` and `password`.
4. `scripts/rmq-init` which will ping rmq management API to create 2 queues needed.
5. `node sendWords.js <path-to-csv-file>` which parses csv and sends to `word-pairs` queue.  This script should be near instantaneous.
6. `node fetchSentences.js` which parses word pairs and spins up local headless browsers to fetch sentences from spanishdict.com, and publish to `word-sentences` queue.
7. `node createCards` will consume from sentences queue and hit local Anki connect api running on port `8765` to create anki cards.


### CSV-Parser

- format is english, spanish
- automatically ignores empty lines, and lines starting with // (for commenting)
- you can specify a spanish pronunciation with `>>`
  - example:  `ear, oreja (external part) / el oído (internal part) >> oreja`
- `<>` can be used to force spanish pronunciation to include more than one word.  otherwise will always be last word (ie, `nino` instead of `el nino`)


### Notes

This uses forked node processes to have multiple CPUs, for better performance of headless browsers.  When running many CPUs though (like > 10) I ran into issues with spanishdict.com rate-limiting by IP (through sophos software looks like).  So I looked into proxying, but that led down a path of more problems (proxies not working, SSL issues, slower load times due to international ads, etc).  So I bagged the proxying but could be a cool future project.


TODO

- add more error handling
- put constants into config

Words to add:

- mascota (pet)
-