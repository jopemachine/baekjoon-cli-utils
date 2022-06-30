# baekjoon-cli-util

Simple code runner and CLI tools for studying and managing [Baekjoon](https://www.acmicpc.net/) algorithm source codes efficiently.

* Create the source code through code, comment template by programming language.
* Just execute your single algorithm source code by entering the problem number regardless of your language details (compiler, cli command tools... etc).
* Automatically download and use all tests, and add the test you need manually.
* Unify commit convention through commit template.

![](./media/demo.png)

Disclaimer:

* This program doesn't handle [Special-judge problems](https://help.acmicpc.net/judge/info) correctly.

## How to install

1. Install the program through `npm`.

```
$ npm i -g baekjoon-cli-util
```

2. Move into your project's root. (where the `.git` folder exists)

3. Configure some template files and settings.

```
$ baekjoon-cli config lang
$ baekjoon-cli config code-template
$ baekjoon-cli config comment-template
```

## Usage

```
Usage
	$ baekjoon-cli create {problem identifier}
	$ baekjoon-cli test {problem identifier}
	$ baekjoon-cli add-test {problem identifier}
	$ baekjoon-cli open {problem identifier}
	$ baekjoon-cli commit {problem identifier}
	$ baekjoon-cli view-tests {problem identifier}

Usage (Update Configs)
	$ baekjoon-cli config lang {language}
	$ baekjoon-cli config code-template
	$ baekjoon-cli config comment-template
	$ baekjoon-cli config commit-message

Supported Languages
	$ cpp
	$ c
	$ java
	$ javascript
	$ python
	$ ruby
	$ swift
	$ rust
	$ go

Examples
	$ baekjoon-cli create 1000
	$ baekjoon-cli config lang
	$ baekjoon-cli config lang cpp
```

## Supported languages

- [x] C++
- [x] C
- [x] Java
- [x] Node.js
- [x] Python
- [x] Go
- [x] Rust
- [x] Swift
- [x] Ruby
- [ ] Kotlin
- [ ] D

## Change runner configuration

You can change your test runner's configuration through creating `runner-settings.json` file to your working directory.

## Change code editor

Some command requires executing your source code editor. You can change the editor to use by setting `EDITOR` environment variable to what you want.
