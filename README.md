# Sidewise

This is a fork of the discontinued [Sidewise Chrome extension][orig-extension]
based on version 2017.2.12.0.

## Features

- Bugs fixed:
  - Fixed Chrome 79 tab hibernation issue ([joelpt/sidewise#82])
  - Fixed data exports being broken ([joelpt/sidewise#83]) - this fork also
    allows you to import broken data exports made by the original extension
  - Video "current playback time" was very buggy - removed legacy Vimeo /
    YouTube / JWPlayer code and fixed a major bug in the HTML5 implementation.
    This feature should now work for any modern video site.
- Improved user privacy:
  - Removed all web requests to Google (for analytics and favicons)
  - Removed all web requests to sidewise.info (for donation pages and bug
    reports)
- Add an audio icon (🔊) to tabs which are playing audio (toggleable in
  options)

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
[joelpt/sidewise#82]: https://github.com/joelpt/sidewise/issues/82
[joelpt/sidewise#83]: https://github.com/joelpt/sidewise/issues/83
