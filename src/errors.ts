import chalk from 'chalk';
import logSymbols from 'log-symbols';
import {supportedLanguages} from './lang.js';
import {supportedAPIProviders} from './api-provider.js';
import {projectName} from './conf.js';

const makeList = (array: string[]) => array.map(string_ => chalk.white(`* ${string_}`)).join('\n');

class FileIndexNotMatchError extends Error {
	constructor() {
		super();
		super.name = 'FileIndexNotMatchError';
		super.message = 'FileIndex not matched. You can try to clear tests and fetch again.';
	}
}

class NotSupportedLanguageError extends Error {
	constructor(lang: string) {
		super();
		super.name = 'NotSupportedLanguageError';
		super.message = `${logSymbols.error} '${lang}' is not supported.\nCurrently supported languages are as follows:\n${makeList(Object.keys(supportedLanguages))}`;
	}
}

class NotSupportedProviderError extends Error {
	constructor(provider: string) {
		super();
		super.name = 'NotSupportedProviderError';
		super.message = `${logSymbols.error} '${provider}' is not supported.\nCurrently supported languages are as follows:\n${makeList(supportedAPIProviders)}`;
	}
}

class ArgumentLengthError extends Error {
	constructor({actualLength, expectedLength}: {actualLength: number; expectedLength: number}) {
		super();
		super.name = 'ArgumentLengthError';
		super.message = `${logSymbols.error} argument length ${actualLength} is not proper. expected value is ${expectedLength}.\nYou can check help manual through '${projectName} --help'`;
	}
}

export {
	ArgumentLengthError,
	FileIndexNotMatchError,
	NotSupportedLanguageError,
	NotSupportedProviderError,
};
