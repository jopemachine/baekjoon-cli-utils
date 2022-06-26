import path from 'node:path';
import process from 'node:process';
import {pathExists} from 'path-exist';
import Conf from 'conf';
import envPaths from 'env-paths';
import {execa} from 'execa';
import logSymbols from 'log-symbols';
import {readFile, writeFile} from './utils.js';
import {supportedLanuages} from './lang.js';

const projectName = 'baekjoon-cli-util';
const paths = envPaths(projectName);

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
};

const defaultEditor = process.env.EDITOR ?? 'vi';

const config: any = new Conf({
	schema,
	projectName,
});

const reset = () => {
	config.clear();
};

const getSourceCodeTemplateFilePath = (lang: string) => path.resolve(paths.data, 'templates', lang);

const getCommentTemplateFilePath = (lang: string) => path.resolve(paths.data, 'comment-templates', lang);

const getGitConfigFilePath = () => path.resolve(paths.data, 'git-config');

const getTestFilesPath = () => path.resolve(paths.data, 'tests');

const getAnswerFilesPath = () => path.resolve(paths.data, 'answers');

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
const setProgrammingLanguage = (lang: string) => {
	const supportedLangs = Object.keys(supportedLanuages);
	if (!supportedLangs.includes(lang)) {
		throw new Error(`${logSymbols.error} Currently '${lang}' not support. Please check READMD.md`);
	}

	config.set('lang', lang);

	const sourceCodeTemplate = getSourceCodeTemplateFilePath(config.get('lang'));
	config.set('sourceCodeTemplate', sourceCodeTemplate);

	const commentTemplate = getCommentTemplateFilePath(config.get('lang'));
	config.set('commentTemplate', commentTemplate);
};

const setSourceCodeTemplate = async () => {
	const templateFilePath = getSourceCodeTemplateFilePath(config.get('lang'));

	if (!pathExists(templateFilePath)) {
		await writeFile(templateFilePath, '');
	}

	await execa(`${defaultEditor} ${templateFilePath}`);
	const sourceCodeTemplate = await readFile(templateFilePath);
	config.set(sourceCodeTemplate);
};

const setCommentTemplate = async () => {
	const templateFilePath = getCommentTemplateFilePath(config.get('lang'));

	if (!pathExists(templateFilePath)) {
		await writeFile(templateFilePath, '');
	}

	await execa(`${defaultEditor} ${templateFilePath}`);
	const commentTemplate = await readFile(templateFilePath);
	config.set(commentTemplate);
};

export {
	checkHealth,
	config,
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
	setCommentTemplate,
};
