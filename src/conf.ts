import path from 'node:path';
import process from 'node:process';
import {pathExists} from 'path-exist';
import Conf from 'conf';
import _envPaths from 'env-paths';
import {execa} from 'execa';
import logSymbols from 'log-symbols';
import {readFile, writeFile} from './utils.js';
import {supportedLanguages} from './lang.js';
import {NotSupportedLanguageError, NotSupportedProviderError} from './errors.js';
import {supportedAPIProviders} from './api-provider.js';

const projectName = 'baekjoon-cli-util';
const envPaths = _envPaths(projectName);

const schema: any = {
	lang: {
		type: 'string',
	},
	commentTemplate: {
		type: 'string',
	},
	sourceCodeTemplate: {
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

const checkHealth = () => {
	const langValue = config.get('lang');
	if (!langValue) {
		throw new Error(`${logSymbols.error} Please set programming language to use.`);
	}

	const sourceCodeTemplate = config.get('sourceCodeTemplate');
	if (!sourceCodeTemplate) {
		throw new Error(`${logSymbols.error} Please set source code template to use.`);
	}

	const commentTemplate = config.get('commentTemplate');
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
};

// TODO: refactor below code using TUI selection control.
const setProgrammingLanguage = (lang: string) => {
	const supportedLangs = Object.keys(supportedLanguages);
	if (!supportedLangs.includes(lang)) {
		throw new NotSupportedLanguageError(lang);
	}

	config.set('lang', lang);

	const sourceCodeTemplate = getSourceCodeTemplateFilePath(config.get('lang'));
	config.set('sourceCodeTemplate', sourceCodeTemplate);

	const commentTemplate = getCommentTemplateFilePath(config.get('lang'));
	config.set('commentTemplate', commentTemplate);
};

const setSourceCodeTemplate = async () => {
	const sourceCodeTemplateFilePath = getSourceCodeTemplateFilePath(config.get('lang'));

	if (!pathExists(sourceCodeTemplateFilePath)) {
		await writeFile(sourceCodeTemplateFilePath, '');
	}

	await execa(defaultEditor, [sourceCodeTemplateFilePath]);
	const sourceCodeTemplate = await readFile(sourceCodeTemplateFilePath);
	config.set(sourceCodeTemplate);
};

const setCommentTemplate = async () => {
	const commentTemplateFilePath = getCommentTemplateFilePath(config.get('lang'));

	if (!pathExists(commentTemplateFilePath)) {
		await writeFile(commentTemplateFilePath, '');
	}

	await execa(defaultEditor, [commentTemplateFilePath]);
	const commentTemplate = await readFile(commentTemplateFilePath);
	config.set(commentTemplate);
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
};
