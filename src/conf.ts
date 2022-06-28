import path from 'node:path';
import process from 'node:process';
import Conf from 'conf';
import _envPaths from 'env-paths';
import logSymbols from 'log-symbols';
import parseJson from 'parse-json';
import {findUp} from 'find-up';
import {readFile, writeFile, pathExists, Logger, mkdir, openEditor} from './utils.js';
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
};

const defaultEditor = process.env.EDITOR ?? 'vi';

const config: any = new Conf({
	schema,
	projectName,
});

const reset = () => {
	config.clear();
};

const getSourceCodeTemplateFilePath = (lang: string) => path.resolve(envPaths.data, 'templates', lang);

const getCommentTemplateFilePath = (lang: string) => path.resolve(envPaths.data, 'comment-templates', lang);

const getGitConfigFilePath = () => path.resolve(envPaths.data, 'git-config');

const getTestFilesPath = () => path.resolve(envPaths.data, 'tests');

const getAnswerFilesPath = () => path.resolve(envPaths.data, 'answers');

const initConfigFilePaths = async () => {
	await mkdir(getGitConfigFilePath(), {recursive: true});
	await mkdir(getTestFilesPath(), {recursive: true});
	await mkdir(getAnswerFilesPath(), {recursive: true});
	await mkdir(path.resolve(envPaths.data, 'templates'), {recursive: true});
	await mkdir(path.resolve(envPaths.data, 'comment-templates'), {recursive: true});
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

// TODO: refactor below code using TUI selection control.
const setProgrammingLanguage = (lang: string) => {
	const supportedLangs = Object.keys(supportedLanguages);
	if (!supportedLangs.includes(lang)) {
		throw new NotSupportedLanguageError(lang);
	}

	config.set('lang', lang);
	Logger.successLog(`lang is now '${lang}'`);

	const sourceCodeTemplate = getSourceCodeTemplateFilePath(config.get('lang'));
	config.set('sourceCodeTemplate', sourceCodeTemplate);
	Logger.successLog(`sourceCodeTemplate is now '${sourceCodeTemplate}'`);

	const commentTemplate = getCommentTemplateFilePath(config.get('lang'));
	config.set('commentTemplate', commentTemplate);
	Logger.successLog(`commentTemplate is now '${commentTemplate}'`);
};

const setSourceCodeTemplate = async () => {
	const sourceCodeTemplateFilePath = getSourceCodeTemplateFilePath(config.get('lang'));

	if (!pathExists(sourceCodeTemplateFilePath)) {
		await writeFile(sourceCodeTemplateFilePath, '');
	}

	await openEditor(sourceCodeTemplateFilePath);
	const sourceCodeTemplate = await readFile(sourceCodeTemplateFilePath);
	config.set('sourceCodeTemplate', sourceCodeTemplate);
	Logger.successLog('sourceCodeTemplate is Updated Successfully');
};

const setCommentTemplate = async () => {
	const commentTemplateFilePath = getCommentTemplateFilePath(config.get('lang'));

	if (!pathExists(commentTemplateFilePath)) {
		await writeFile(commentTemplateFilePath, '');
	}

	await openEditor(commentTemplateFilePath);
	const commentTemplate = await readFile(commentTemplateFilePath);
	config.set('commentTemplate', commentTemplate);
	Logger.successLog('commentTemplate is Updated Successfully');
};

const helpMessage = `

`;

const runnerSettingFileName = 'runner-settings.json';

const readRunnerSettings = async () => {
	const currentDirSettingFilePath = path.resolve(process.cwd(), runnerSettingFileName);
	if (pathExists(currentDirSettingFilePath)) {
		return parseJson(await readFile(currentDirSettingFilePath));
	}

	const settingFilePath = await findUp(runnerSettingFileName);
	if (!settingFilePath) {
		throw new Error('runner setting file not found!');
	}

	return parseJson(await readFile(settingFilePath));
};

export {
	readRunnerSettings,
	helpMessage,
	checkHealth,
	config,
	envPaths,
	reset,
	projectName,
	getSourceCodeTemplateFilePath,
	getCommentTemplateFilePath,
	getGitConfigFilePath,
	defaultEditor,
	getTestFilesPath,
	getAnswerFilesPath,
	setProgrammingLanguage,
	setSourceCodeTemplate,
	setAPIProvider,
	setCommentTemplate,
	initConfigFilePaths,
	setTimeoutValue,
};
