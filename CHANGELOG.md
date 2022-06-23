# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.6.3 (2022-06-23)

### Others

* Update dependencies and Resolve vulnerabilities

### 0.6.2 (2022-01-20)

### Bug Fixes

* **Editor:** The git data caches are not cleared when the editor closed

### Others

* Update marked module to v4.0.10
* Update octokit module to v18.12.0

### 0.6.1 (2021-12-09)

### Bug Fixes

* Can't resolve git hosting service url with SSH protocol, closes [#3](https://github.com/phoihos/vscode-git-commit-message-editor/issues/3)

## 0.6.0 (2021-12-08)

### Features

* **IntelliSense:** Add a new scope suggestion feature
    * If `gitCommitMessageEditor.intelliSense.completion.logScopes.enabled` option is `true`, the scope suggestion list also includes the parsed scopes from existing commit history.

### Others

* Update gitmojis module to v3.8.0

### 0.5.3 (2021-11-12)

### Features

* **Editor:** Open the commit message editor with the repository containing the current active file

### 0.5.2 (2021-10-14)

### Bug Fixes

* Unable to open the specific repo from the Source Control view, closes [#1](https://github.com/phoihos/vscode-git-commit-message-editor/issues/1)

### 0.5.1 (2021-09-16)

### Bug Fixes

* Fix previewing of images in the issue description widget
* Fix the calculation of some hover ranges

## 0.5.0 (2021-09-08)

### Features

* **IntelliSense:** Add hover features for summary and footer
    * Support Type, Scope and Emoji of the Summary line
    * Support Type, Issues and Commits of the Footer lines

### Others

* Update README
    * Add descriptions for new features
    * Update other descriptions

### 0.4.2 (2021-09-06)

### Bug Fixes

* Correct minor typos of infomation messages
* The consent of GitHub authentication does not apply immediately

### 0.4.1 (2021-09-03)

### Bug Fixes

* Error handling for GitHub private repository

### Others

* Update README

## 0.4.0 (2021-09-03)

### Features

* **IntelliSense**
    * Add issues completion feature for the Footer type `Closes`
    * Add commits completion feature for the Footer type `Refs`
    * Add author name for commit details

### Others

* Update README
    * Add descriptions for new features
    * Update other descriptions

### 0.3.1 (2021-08-20)

### Others

* Update README
    * Add more description to **Editor** section
    * Escape `#133` link to non-link

## 0.3.0 (2021-08-19)

### Features

* **Parser:** Allow the scope can optionally begin with $
    * You can also create new scope beginning with $

### Enhancements

* **IntelliSense:** Update the description of the Footer Types

## 0.2.0 (2021-08-18)

### Features

* **IntelliSense:** Add trigger all gitmoji suggestions
    * Cancel (pressing <kbd>Esc</kbd>) the suggestions widget and re-trigger by typing <kbd>Ctrl</kbd>+<kbd>Space</kbd> follow the `:` (colon)

### Others

* Update README

### 0.1.1 (2021-08-17)

### Enhancements

* **IntelliSense:** The emoji of the Closes type of the Footer changed to 🔗 from #️⃣

## 0.1.0 (2021-08-13)

* 🎉 The extension was released
