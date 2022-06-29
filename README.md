# baekjoon-cli-util

Simple code runner and CLI tools for studying and managing [Baekjoon](https://www.acmicpc.net/) algorithm source codes efficiently.

* Create the source code through code, comment template by programming language.
* Just execute your single algorithm source code by entering the problem number regardless of your language details (compiler, cli command tools... etc).
* Automatically download and use all tests, and add the test you need manually.
* Unify commit convention through commit template.

Disclaimer:

* This program doesn't handle [special judge problems](https://help.acmicpc.net/judge/info) correctly.

## How to install

```
$ npm i -g baekjoon-cli-util
```

## Usage

```
Usage
	$ baekjoon-cli create {problem identifier}
	$ baekjoon-cli test {problem identifier}
	$ baekjoon-cli open {problem identifier}
	$ baekjoon-cli commit {problem identifier}
	$ baekjoon-cli view-tests {problem identifier}

Configs
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

## Supported Languages

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