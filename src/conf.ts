import path from 'node:path';
import process from 'node:process';
import Conf from 'conf';
import _envPaths from 'env-paths';
import logSymbols from 'log-symbols';
import parseJson from 'parse-json';
import inquirer from 'inquirer';
import {findUp} from 'find-up';
import del from 'del';
import {readFile, writeFile, pathExists, Logger, mkdir, openEditor, ensureCwdIsProjectRoot} from './utils.js';
import {supportedLanguages} from './lang.js';
import {NotSupportedLanguageError, NotSupportedProviderError} from './errors.js';
import {supportedAPIProviders} from './api-provider.js';

const projectName = 'baekjoon-cli-util';
const envPaths = _envPaths(projectName);

const schema: any = {
	lang: {
		type: 'string',
	},
	provider: {
		type: 'string',
		default: 'baekjoon',
	},
	timeout: {
		type: 'number',
		default: 5000,
	},
	pageSize: {
		type: 'number',
		default: 10,
	},
};

const defaultEditor = process.env.EDITOR ?? 'vi';

const config: any = new Conf({
	schema,
	projectName,
});

const getSourceCodeTemplateDirPath = () => path.resolve(envPaths.data, 'templates');

const getSourceCodeTemplateFilePath = (lang: string) => path.resolve(getSourceCodeTemplateDirPath(), lang);

const getCommentTemplateDirPath = () => path.resolve(envPaths.data, 'comment-templates');

const getCommentTemplateFilePath = (lang: string) => path.resolve(getCommentTemplateDirPath(), lang);

const getGitConfigFilePath = () => path.resolve(envPaths.data, 'git-config');

const getTestFilesPath = () => path.resolve(envPaths.data, 'tests');

const getAnswerFilesPath = () => path.resolve(envPaths.data, 'answers');

const getCommitMessageTemplateFilePath = () => path.resolve(getGitConfigFilePath(), 'commit-message');

const initConfigFilePaths = async () => {
	await mkdir(getGitConfigFilePath(), {recursive: true});
	await mkdir(getTestFilesPath(), {recursive: true});
	await mkdir(getAnswerFilesPath(), {recursive: true});
	await mkdir(getSourceCodeTemplateDirPath(), {recursive: true});
	await mkdir(getCommentTemplateDirPath(), {recursive: true});

	await writeFile(getCommitMessageTemplateFilePath(), '[{relativeDirectoryPath}] Solve {id}');
};

const checkHealth = async () => {
	if (!config.get('lang')) {
		throw new Error(`${logSymbols.error} Please set programming language to use.`);
	}

	if (!config.get('provider')) {
		throw new Error(`${logSymbols.error} Please set proper api provider to use.`);
	}

	const lang = config.get('lang');
	if (!await pathExists(getSourceCodeTemplateFilePath(lang))) {
		throw new Error(`${logSymbols.error} Please set source code template to use.\nIf you do not need the source code template, just create empty file.`);
	}

	if (!await pathExists(getCommentTemplateFilePath(lang))) {
		throw new Error(`${logSymbols.error} Please set comment template to use.\nIf you do not need the comment template, just create empty file.`);
	}

	await ensureCwdIsProjectRoot();
};

const setTimeoutValue = (timeoutValue: number) => {
	config.set('timeout', timeoutValue);
	Logger.successLog(`timeout is now '${timeoutValue}'`);
};

// TODO: refactor below code using TUI selection control.
const setAPIProvider = (provider: string) => {
	if (supportedAPIProviders.includes(provider)) {
		throw new NotSupportedProviderError(provider);
	}

	config.set('provider', provider);
	Logger.successLog(`provider is now '${provider}'`);
};

const setProgrammingLanguage = async (lang?: string) => {
	const supportedLangs = Object.keys(supportedLanguages).sort();

	if (!lang) {
		lang = (await inquirer.prompt([{
			name: 'language',
			message: 'Select Programming Language',
			type: 'autocomplete',
			pageSize: Number(config.get('pageSize')),
			source: (_answers: any[], input: string) => supportedLangs.filter(langCode => !input || langCode.includes(input)).map(langCode => ({name: langCode, value: langCode})),
		}])).language;
	}

	if (!supportedLangs.includes(lang!)) {
		throw new NotSupportedLanguageError(lang!);
	}

	config.set('lang', lang);
	Logger.successLog(`lang is now '${lang}'`);

	const sourceCodeTemplate = getSourceCodeTemplateFilePath(config.get('lang'));
	if (!await pathExists(sourceCodeTemplate)) {
		await writeFile(sourceCodeTemplate, '');
	}

	Logger.successLog(`sourceCodeTemplate is now '${sourceCodeTemplate}'`);

	const commentTemplate = getCommentTemplateFilePath(config.get('lang'));
	if (!await pathExists(commentTemplate)) {
		await writeFile(commentTemplate, '');
	}

	Logger.successLog(`commentTemplate is now '${commentTemplate}'`);
};

const setSourceCodeTemplate = async () => {
	const sourceCodeTemplateFilePath = getSourceCodeTemplateFilePath(config.get('lang'));

	if (!await pathExists(sourceCodeTemplateFilePath)) {
		await writeFile(sourceCodeTemplateFilePath, '');
	}

	await openEditor(sourceCodeTemplateFilePath);
	Logger.successLog('sourceCodeTemplate is Updated Successfully');
};

const setGitCommitMessageTemplate = async () => {
	const commitMessageTemplateFilePath = getCommitMessageTemplateFilePath();

	if (!await pathExists(commitMessageTemplateFilePath)) {
		await writeFile(commitMessageTemplateFilePath, '');
	}

	await openEditor(commitMessageTemplateFilePath);
	Logger.successLog('commitMessageTemplateFile is Updated Successfully');
};

const setCommentTemplate = async () => {
	const commentTemplateFilePath = getCommentTemplateFilePath(config.get('lang'));

	if (!await pathExists(commentTemplateFilePath)) {
		await writeFile(commentTemplateFilePath, '');
	}

	await openEditor(commentTemplateFilePath);
	Logger.successLog('commentTemplate is Updated Successfully');
};

const clearAllTestData = async () => {
	await del(getTestFilesPath(), {force: true});
	await del(getAnswerFilesPath(), {force: true});
	await mkdir(getTestFilesPath());
	await mkdir(getAnswerFilesPath());
	Logger.successLog('All test data removed.');
};

const helpMessage = `
	Usage
	  $ baekjoon-cli create {problem identifier}
	  $ baekjoon-cli open {problem identifier}
	  $ baekjoon-cli commit {problem identifier}
	  $ baekjoon-cli clear-test {problem identifier}
	  $ baekjoon-cli clear-tests {problem identifier}

	Configs
	  $ baekjoon-cli config lang {language}
	  $ baekjoon-cli config timeout {ms}
	  $ baekjoon-cli config code-template
	  $ baekjoon-cli config comment-template
	  $ baekjoon-cli config commit-message
	  $ baekjoon-cli config provider {provider}

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
`;

const runnerSettingFileName = 'runner-settings.json';

const readRunnerSettings = async () => {
	const currentDirSettingFilePath = path.resolve(process.cwd(), runnerSettingFileName);
	if (await pathExists(currentDirSettingFilePath)) {
		return parseJson(await readFile(currentDirSettingFilePath));
	}

	const settingFilePath = await findUp(runnerSettingFileName);
	if (!settingFilePath) {
		throw new Error(`'${runnerSettingFileName}' not found!`);
	}

	return parseJson(await readFile(settingFilePath));
};

export {
	clearAllTestData,
	checkHealth,
	config,
	defaultEditor,
	envPaths,
	getAnswerFilesPath,
	getCommitMessageTemplateFilePath,
	getCommentTemplateFilePath,
	getGitConfigFilePath,
	getSourceCodeTemplateFilePath,
	getTestFilesPath,
	helpMessage,
	initConfigFilePaths,
	projectName,
	readRunnerSettings,
	setAPIProvider,
	setCommentTemplate,
	setGitCommitMessageTemplate,
	setProgrammingLanguage,
	setSourceCodeTemplate,
	setTimeoutValue,
};
