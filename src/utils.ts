import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import {pathExists as _pathExists, pathExistsSync as _pathExistsSync} from 'path-exists';
import {unusedFilename} from 'unused-filename';
import {execa} from 'execa';
import {globby} from 'globby';
import chalk from 'chalk';
import filenamify from 'filenamify';
import {defaultEditor, getCommitMessageTemplateFilePath} from './conf.js';
import {terminalWidth, useSpinner} from './spinner.js';
import {InvalidCwdError} from './errors.js';
import {Problem} from './problem.js';

const fsp = fs.promises;

const unusedFileNameIncrementer = (filename: string, extension: string): [string, string] => {
	const match = /^(?<originalFilename>\d+)_(?<index>\d+)$/.exec(filename);

	let {originalFilename, index} = match ? (match.groups as any) : {originalFilename: filename, index: 1};
	originalFilename = originalFilename.trim();
	return [`${originalFilename}${extension}`, `${originalFilename}_${++index}${extension}`];
};

const parsePath = (targetPath: string) => {
	const [id, idx] = path.parse(targetPath).name.split('_');
	return {id, idx: Number(idx)};
};

const readFile = async (filepath: string) => fsp.readFile(filepath, {encoding: 'utf-8'});

const writeFile = async (filepath: string, data: any) => fsp.writeFile(filepath, data, {encoding: 'utf-8'});

const Logger = {
	log: console.log,
	successLog(message: string) {
		console.log(`${logSymbols.success} ${message}`);
	},
	warningLog(message: string) {
		console.log(`${logSymbols.warning} ${message}`);
	},
	infoLog(message: string) {
		console.log(`${logSymbols.info} ${message}`);
	},
	errorLog(message: string) {
		console.log(`${logSymbols.error} ${message}`);
	},
};

const getUnusedFilename = async (filePath: string) => unusedFilename(filePath, {incrementer: unusedFileNameIncrementer});

const {mkdir} = fsp;

const {mkdirSync} = fs;

const pathExists = _pathExists;

const pathExistsSync = _pathExistsSync;

const findProblemPath = async (problemId: string): Promise<string> => {
	let problemPath;

	const paths = await globby([`**/${problemId}`, `**/${problemId}.*`, `**/${problemId}_*.*`]);
	if (paths.length === 0) {
		Logger.errorLog(`Failed to find '${problemId}' under the subdirectories!`);
		process.exit(1);
	}

	if (paths.length > 1) {
		await inquirer
			.prompt([
				{
					type: 'list',
					name: 'file',
					message: chalk.dim('Choose A Problem Source File Path'),
					choices: paths.map(path => ({name: path, value: path})),
				},
			])
			.then((selection: any) => {
				problemPath = selection.file;
			});
	} else {
		problemPath = paths[0];
	}

	if (!problemPath) {
		throw new Error('Path not found');
	}

	return problemPath;
};

const openEditor = async (targetPath: string) => execa(defaultEditor, [targetPath], {
	stdio: 'inherit',
});

const getProblemFolderNames = (paths: string[], input: string) => paths.filter(pth => !input || pth.toLowerCase().includes(input.toLowerCase())).map(pth => ({
	name: pth.split(`${process.cwd()}${path.sep}`)[1],
	value: pth,
}));

const getProblemPathId = ({sourceFilePath, isRelative}: {sourceFilePath: string; isRelative: boolean}) => {
	const relativePath = isRelative ? sourceFilePath : sourceFilePath.split(process.cwd())[1];
	const {name} = path.parse(sourceFilePath);
	const temporaryArray = relativePath.split('/');
	temporaryArray.pop();

	return filenamify(path.join(temporaryArray.join(path.sep), name.split('_')[0]));
};

const printDividerLine = () => {
	Logger.log(chalk.dim.gray(`+${'-'.repeat(terminalWidth - 2)}+`));
};

const cpFile = fsp.copyFile;

const ensureCwdIsProjectRoot = async () => {
	if (!await pathExists(path.resolve(process.cwd(), '.git'))) {
		throw new InvalidCwdError();
	}
};

const commitProblem = async (problem: Problem, problemPath: string) => {
	const {dir: relativeDirectoryPath} = path.parse(problemPath);
	const dict = {
		id: problem.problemId,
		...problem.problemInfo,
		relativeDirectoryPath,
	};

	let commitMessageTemplate = await readFile(getCommitMessageTemplateFilePath());
	for (const [propertyKey, propertyValue] of Object.entries(dict)) {
		commitMessageTemplate = commitMessageTemplate.replace(`{${propertyKey}}`, propertyValue);
	}

	await useSpinner(async () => {
		await execa('git', ['add', problemPath]);
		await execa('git', ['commit', '-m', commitMessageTemplate]);
	}, 'Git Commit');
};

const makeList = (array: string[]) => array.map(string_ => `${chalk.cyan('*')} ${chalk.yellow(string_)}`).join('\n');

const {chmod} = fsp;

export {
	chmod,
	makeList,
	commitProblem,
	ensureCwdIsProjectRoot,
	cpFile,
	mkdir,
	mkdirSync,
	parsePath,
	getProblemPathId,
	getUnusedFilename,
	unusedFileNameIncrementer,
	readFile,
	writeFile,
	pathExists,
	pathExistsSync,
	Logger,
	openEditor,
	findProblemPath,
	getProblemFolderNames,
	printDividerLine,
};
