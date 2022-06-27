import path from 'node:path';
import process from 'node:process';
import Conf from 'conf';
import _envPaths from 'env-paths';
import logSymbols from 'log-symbols';
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
	const lang = config.get('lang');
	if (!lang) {
		throw new Error(`${logSymbols.error} Please set programming language to use.`);
	}

	const provider = config.get('provider');
	if (!provider) {
		throw new Error(`${logSymbols.error} Please set proper api provider to use.`);
	}

	const sourceCodeTemplate = await pathExists(getSourceCodeTemplateFilePath(lang));
	if (!sourceCodeTemplate) {
		throw new Error(`${logSymbols.error} Please set source code template to use.`);
	}

	const commentTemplate = await pathExists(getCommentTemplateFilePath(lang));
	if (!commentTemplate) {
		throw new Error(`${logSymbols.error} Please set comment template to use.`);
	}
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
	Logger.successLog(`sourceCodeTemplate is set successfully under '${sourceCodeTemplateFilePath}'`);
};

const setCommentTemplate = async () => {
	const commentTemplateFilePath = getCommentTemplateFilePath(config.get('lang'));

	if (!pathExists(commentTemplateFilePath)) {
		await writeFile(commentTemplateFilePath, '');
	}

	await openEditor(commentTemplateFilePath);
	const commentTemplate = await readFile(commentTemplateFilePath);
	config.set('commentTemplate', commentTemplate);
	Logger.successLog(`commentTemplate is set successfully under '${commentTemplateFilePath}'`);
};

export {
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
};
