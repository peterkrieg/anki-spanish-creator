# Anki-Spanish-Creator

This is used to bulk-create spanish words into a deck.  Used to save time because doing so from the UI takes way longer.  Also has features like auto-fetching pronunciation mp3 of spanish word, and sample sentences, from spanishdict.


### Instructions

1. Put words you'd like to learn into a csv under `words` directory, in format: english word,spanish word.  The csv parser will automatically ignore empty lines and lines starting with // (for commenting)
2. Make sure anki is running locally, with anki connect plugin installed (https://ankiweb.net/shared/info/2055492159)
3. `docker-compose up -d` which will spin up a local RMQ, and expose management port to port `8080`.  Open `localhost:8080` in browser to see management UI, with default creds of `guest` for both `username` and `password`.
4. `node sendWords.js` which parses csv and sends to `word-pairs` queue.  This script should be near instantaneous.
5. `node fetchSentences.js` which parses word pairs and spins up local headless browsers to fetch sentences from spanishdict.com, and publish to `word-sentences` queue.
6. `node createCards` will consume from sentences queue and hit local Anki connect api running on port `8765` to create anki cards.


### Notes

This uses forked node processes to have multiple CPUs, for better performance of headless browsers.  When running many CPUs though (like > 10) I ran into issues with spanishdict.com rate-limiting by IP (through sophos software looks like).  So I looked into proxying, but that led down a path of more problems (proxies not working, SSL issues, slower load times due to international ads, etc).  So I bagged the proxying but could be a cool future project.


