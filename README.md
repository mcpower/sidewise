# Sidewise

This is a fork of the discontinued [Sidewise Chrome extension][orig-extension]
based on version 2017.2.12.0. This fork's main purpose is to fix major bugs
and to improve user privacy by minimising the number of requests made to third
party websites (like Google and sidewise.info).

## License

The Chrome extension distributed in the Chrome Web Store includes a modified
MIT License, which you can find in `LICENSE.txt`. It contains additional
restrictions on distribution on the Chrome Web Store, or selling/sublicensing
without written permission from the original author.

As this project is derived from the original Sidewise extension, this project
is also licensed under the same license as the original. The original author
**has not** given this project written permission to sublicense.

Additionally, the original author **has not** given this project written
permission to distribute this project on the Chrome Web Store. You must install
this extension as an unpacked extension.

## Installation

Before installing this fork, it is highly recommended to create a backup of
your Sidewise data by going to the options, showing advanced options, then
clicking the "Export data" button at the very bottom.

To install this extension, obtain a copy of this repository by either
[zip download][zip-download] or a git clone. Navigate to `chrome://extensions`,
enable developer mode with the toggle on the top-right corner. Then, click
"Load unpacked" and select the folder containing `manifest.json`. You can also
drag the aforementioned folder into the `chrome://extensions` page.

As this fork uses the same `manifest.json` key as the original extension, your
existing Sidewise data should automatically be loaded when you install the
extension. If anything goes wrong, you can import your data backup from the
options page.

[orig-extension]: https://chrome.google.com/webstore/detail/sidewise-tree-style-tabs/biiammgklaefagjclmnlialkmaemifgo
[zip-download]: https://github.com/mcpower/sidewise/archive/master.zip
