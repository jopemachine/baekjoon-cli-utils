import {outdent} from 'outdent';
import {supportedLanguageEnum} from './lang.js';

const processCodeSourceTemplate = (template: string, problemInfoDict: Record<string, string>) => {
	let result = template;

	for (const problemInfoKey of Object.keys(problemInfoDict)) {
		result = result.replace(`{${problemInfoKey}}`, (problemInfoDict as any)[problemInfoKey]);
	}

	return result;
};

const getDefaultCode = (langCode: keyof typeof supportedLanguageEnum) => {
	const defaultCodes: Record<typeof langCode, string> = {
		c: outdent`
			#include <stdio.h>
			int main() {
				return 0;
			}
		`,
		cpp: outdent`
			#include <iostream>
			using namespace std;
			int main() {
				return 0;
			}
		`,

		python: outdent``,
		java: outdent`
			import java.util.*;
			public class Main{
				public static void main(String args[]){
					Scanner sc = new Scanner(System.in);
				}
			}
		`,
		ruby: outdent``,
		swift: outdent`
			import Foundation
			let line = readLine()!
		`,
		javascript: outdent`
			var fs = require('fs');
			var input = fs.readFileSync('/dev/stdin').toString().split(' ');
		`,
		go: outdent`
			package main

			import "fmt"

			func main() {
				fmt.Scanf()
			}
		`,
		rust: outdent`
			use std::io;

			fn main() {
			}
		`,
		// Kotlin: outdent`
		// import java.util.Scanner

		// fun main(args: Array<String>) {
		// 	val sc: Scanner = Scanner(System.\`in\`)
		// }
		// `,
	};

	return defaultCodes[langCode];
};

const defaultCommentTemplate = outdent`
  ==============================================================================================
  @ Title: {title}
  @ URL: {url}
  @ Created Date: {date}
  @ Problem:
  {text}
  @ Input Example: {input}
  @ Output Example: {output}
  ==============================================================================================
`;

const commentStartEnd: Record<keyof typeof supportedLanguageEnum, [string, string]> = {
	c: ['/*', '*/'],
	cpp: ['/*', '*/'],
	javascript: ['/*', '*/'],
	java: ['/*', '*/'],
	go: ['/*', '*/'],
	rust: ['/*', '*/'],
	swift: ['/*', '*/'],
	python: ['\'\'\'', '\'\'\''],
	ruby: ['=begin', '=end'],
};

const getDefaultCommentTemplate = (langCode: keyof typeof supportedLanguageEnum) => {
	const [start, end] = commentStartEnd[langCode];
	return outdent`${start}\n${defaultCommentTemplate}\n${end}`;
};

const getDefaultCodeTemplate = (langCode: keyof typeof supportedLanguageEnum) => `${getDefaultCommentTemplate(langCode)}\n${getDefaultCode(langCode)}`;

export {
	getDefaultCodeTemplate,
	processCodeSourceTemplate,
	getDefaultCode,
};
