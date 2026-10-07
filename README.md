# LC Dev

Chrome extension for LambdaCurry Medusa work on `lambda-curry/360training` and Jira project `MI`.

- Open a Jira ticket (`1550` or `MI-1550`)
- Open the pull request whose title contains that ticket
- Open a pull request by number
- Ask Currybot to review: add `currybot-review` if it is missing, otherwise comment `@currybot-lc re-review please`

## Install

1. Open `chrome://extensions`, enable Developer mode, and choose Load unpacked on this folder.
2. Create a fine-grained GitHub token for `lambda-curry/360training` with Issues read and write, and Pull requests read.
3. Open the extension’s Token page and save the token. Jira and “PR by number” work without it.

## Shortcut

`Ctrl+Shift+.` opens the same actions on normal web pages. It does nothing while focus is in a text field. It does not run on `chrome://` pages or the new tab; use the toolbar button there.

`node src/actions.test.js` checks ticket parsing and the Currybot label-vs-comment choice.
