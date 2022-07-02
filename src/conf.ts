import path from 'node:path';
import process from 'node:process';
import Conf from 'conf';
import _envPaths from 'env-paths';
import logSymbols from 'log-symbols';
import parseJson from 'parse-json';
import inquirer from 'inquirer';
import {findUp} from 'find-up';
import del from 'del';
import chalk from 'chalk';
import {readFile, writeFile, pathExists, Logger, mkdir, openEditor, ensureCwdIsProjectRoot} from './utils.js';
import {getDefaultCommentTemplate, supportedLanguages} from './lang.js';
import {NotSupportedLanguageError, NotSupportedProviderError} from './errors.js';
import {supportedAPIProviders} from './api-provider.js';

const projectName = 'baekjoon-cli-util';
const envPaths = _envPaths(projectName);

const configSchema: any = {
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
	schema: configSchema,
	projectName,
});

const getSourceCodeTemplateDirPath = () => path.resolve(envPaths.data, 'templates');

const getSourceCodeTemplateFilePath = (lang: string) => path.resolve(getSourceCodeTemplateDirPath(), lang);

const getGitConfigFilePath = () => path.resolve(envPaths.data, 'git-config');

const getTestFilesPath = () => path.resolve(envPaths.cache, 'tests');

const getAnswerFilesPath = () => path.resolve(envPaths.cache, 'answers');

const getCommitMessageTemplateFilePath = () => path.resolve(getGitConfigFilePath(), 'commit-message');

const defaultCommitMessageTemplate = '[{relativeDirectoryPath}] Solve {id}';

const initConfigFilePaths = async () => {
	await mkdir(getGitConfigFilePath(), {recursive: true});
	await mkdir(getTestFilesPath(), {recursive: true});
	await mkdir(getAnswerFilesPath(), {recursive: true});
	await mkdir(getSourceCodeTemplateDirPath(), {recursive: true});

	await writeFile(getCommitMessageTemplateFilePath(), defaultCommitMessageTemplate);
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
	const supportedLangs = supportedLanguages.sort();

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

	const sourceCodeTemplateFilePath = getSourceCodeTemplateFilePath(config.get('lang'));
	if (!await pathExists(sourceCodeTemplateFilePath)) {
		await writeFile(sourceCodeTemplateFilePath, '');
	}
};

const setGitCommitMessageTemplate = async () => {
	const commitMessageTemplateFilePath = getCommitMessageTemplateFilePath();

	if (!await pathExists(commitMessageTemplateFilePath)) {
		await writeFile(commitMessageTemplateFilePath, defaultCommitMessageTemplate);
	}

	await openEditor(commitMessageTemplateFilePath);
	Logger.successLog('commitMessageTemplateFile is Updated Successfully');
};

const setSourceCodeTemplate = async (langCode: string) => {
	const sourceCodeTemplateFilePath = getSourceCodeTemplateFilePath(langCode);

	if (!await pathExists(sourceCodeTemplateFilePath)) {
		await writeFile(sourceCodeTemplateFilePath, getDefaultCommentTemplate(langCode as any));
	}

	await openEditor(sourceCodeTemplateFilePath);
	Logger.successLog('sourceCodeTemplate is Updated Successfully');
};

const setPageSizeValue = (pageSize: number) => {
	config.set('pageSize', pageSize);
	Logger.successLog(`pageSize is now '${pageSize}'`);
};

const clearAllTestData = async () => {
	await del(getTestFilesPath(), {force: true});
	await del(getAnswerFilesPath(), {force: true});
	await mkdir(getTestFilesPath());
	await mkdir(getAnswerFilesPath());
	Logger.successLog('All test data removed.');
};

const helpMessage = `
Simple code runner and CLI tools for studying and managing Baekjoon algorithm source codes efficiently.

${chalk.bold('Commands')}
  create		Create the problem source code on the subdirectory, and fetch tests.
  test			Find, compile and run a problem source code.
  add-test		Add additional test manually by code editor.
  edit-test		Edit test manually by code editor.
  open			Open the problem's URL in your browser.
  commit		Commit the problem source code to Git.
  clear-test		Clear the specified problem's test.
  clear-tests		Clear all the problem's tests.
  view-tests		Check the problem's tests.
  config		Check and update templates, configurations.

${chalk.bold('Usage')}
  $ baekjoon-cli [create <problem identifier>]
  $ baekjoon-cli [test <problem identifier>]
  $ baekjoon-cli [add-test <problem identifier>]
  $ baekjoon-cli [edit-test <problem identifier> <test index>]
  $ baekjoon-cli [open <problem identifier>]
  $ baekjoon-cli [commit <problem identifier>]
  $ baekjoon-cli [clear-test <problem identifier> <test index>]
  $ baekjoon-cli [clear-tests <problem identifier>]
  $ baekjoon-cli [view-tests <problem identifier>]

${chalk.bold('Configs')}
  lang			Default programming language to use.
  timeout		A timeout value of test runner. Test runner exit the test if the running time is greater than this value.
  code-template		Code template used by \`create\`.
  commit-message	Commit message template used by \`commit\`.

${chalk.bold('Usage')}
  $ baekjoon-cli [config]
  $ baekjoon-cli [config lang <language>]
  $ baekjoon-cli [config timeout <ms>]
  $ baekjoon-cli [config code-template]
  $ baekjoon-cli [config commit-message]
`.trim();

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
	checkHealth,
	clearAllTestData,
	config,
	defaultEditor,
	envPaths,
	getAnswerFilesPath,
	getCommitMessageTemplateFilePath,
	getGitConfigFilePath,
	getSourceCodeTemplateFilePath,
	getTestFilesPath,
	helpMessage,
	initConfigFilePaths,
	projectName,
	readRunnerSettings,
	runnerSettingFileName,
	setAPIProvider,
	setGitCommitMessageTemplate,
	setPageSizeValue,
	setProgrammingLanguage,
	setSourceCodeTemplate,
	setTimeoutValue,
};
