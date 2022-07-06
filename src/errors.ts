import logSymbols from 'log-symbols';
import {supportedLanguages} from './lang.js';
import {supportedAPIProviders} from './api-provider.js';
import {makeList} from './utils.js';
import {runnerSettingFileName} from './conf.js';

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
		super.message = `${logSymbols.error} '${lang}' is not supported.\n${logSymbols.info} Currently supported languages are as follows:\n${makeList(supportedLanguages)}`;
	}
}

class NotSupportedProviderError extends Error {
	constructor(provider: string) {
		super();
		super.name = 'NotSupportedProviderError';
		super.message = `${logSymbols.error} '${provider}' is not supported.\n${logSymbols.info} Currently supported languages are as follows:\n${makeList(supportedAPIProviders)}`;
	}
}

class ArgumentLengthError extends Error {
	constructor({actualLength, expectedLength}: {actualLength: number; expectedLength: number}) {
		super();
		super.name = 'ArgumentLengthError';
		super.message = `${logSymbols.error} Expected argument length is ${expectedLength}. Actual value is ${actualLength}.\n${logSymbols.info} You can check help manual through 'baekjoon-cli help'`;
	}
}

class InvalidCwdError extends Error {
	constructor() {
		super();
		super.name = 'InvalidCwdError';
		super.message = `${logSymbols.warning} You should run the program in the project root.`;
	}
}

class TestsNotFoundError extends Error {
	constructor() {
		super();
		super.name = 'TestsNotFoundError';
		super.message = `${logSymbols.error} No Test Case Found.`;
	}
}

class RunnerConfigFileNotValidError extends Error {
	constructor() {
		super();
		super.name = 'RunnerConfigFileNotValidError';
		super.message = `${logSymbols.error} ${runnerSettingFileName} not valid!`;
	}
}

class NotValidFlagError extends Error {
	constructor(commandName: string, flagName: string) {
		super();
		super.name = 'NotValidFlagError';
		super.message = `${logSymbols.error} You cannot use '${flagName}' with '${commandName}'`;
	}
}

export {
	NotValidFlagError,
	ArgumentLengthError,
	FileIndexNotMatchError,
	InvalidCwdError,
	NotSupportedLanguageError,
	NotSupportedProviderError,
	TestsNotFoundError,
	RunnerConfigFileNotValidError,
};
