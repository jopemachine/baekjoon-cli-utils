import process from 'node:process';
import path from 'node:path';
import chalk from 'chalk';
import {execa} from 'execa';
import {globby} from 'globby';
import logSymbols from 'log-symbols';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import {Problem} from './problem.js';
import {Logger, readFile, writeFile, getUnusedFilename} from './utils.js';
import {config} from './conf.js';
import {Test} from './test.js';
import {processCommentTemplate} from './template.js';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

interface EndPoint {
	getProblem?: string;
}

const supportedAPIProviders = [
	'baekjoon',
];

abstract class APIProvider {
	endPoints: EndPoint = {};

	async createProblem(problem: Problem) {
		const {problemId} = problem;
		let paths = await globby('**/*', {
			onlyDirectories: true,
		});

		paths = [(await inquirer.prompt([{
			name: 'folder',
			message: `${logSymbols.info} Select An Folder To Save The File`,
			type: 'autocomplete',
			pageSize: 10,
			source: (_answers: any[], input: string) => this.getProblemFolderNames(paths, input),
		}])).folder];

		const {title} = await this.fetchProblemAttributes(problem);

		const pathToSave = await getUnusedFilename(
			path.resolve(paths[0], [problemId, config.get('extension')].join('.')),
		);

		const template = await readFile(path.resolve(config.get('template')));
		const commentTemplate = processCommentTemplate(await readFile(path.resolve(config.get('commentTemplate'))), {
			title,
		});

		await writeFile(pathToSave, `${commentTemplate}\n${template}`);
		await this.fetchTests(problem);
	}

	getProblemFolderNames(paths: string[], input: string) {
		return paths.filter(path => !input || path.toLowerCase().includes(input.toLowerCase())).map(path => ({
			name: path.split('/')[1],
			value: path,
		}));
	}

	async commitProblem(problem: Problem) {
		const {problemId} = problem;
		let paths = await globby(`**/${problemId}*.*`);

		if (paths.length === 0) {
			Logger.errorLog(`Failed To Find '${problemId}'!`);
			process.exit(1);
		}

		if (paths.length > 1) {
			await inquirer
				.prompt([
					{
						type: 'list',
						name: 'file',
						message: chalk.dim('Choose File To Commit'),
						choices: paths.map(path => ({name: path, value: path})),
					},
				])
				.then((selection: any) => {
					paths = [selection.file];
				});
		}

		const {dir} = path.parse(paths[0]);
		await execa('git', ['add', paths[0]]);
		await execa('git', ['commit', '-m', `[${dir}] Solve ${problemId}`]);
		Logger.successLog(`'${paths[0]}' Committed Successfully.`);
	}

	abstract fetchProblemInfo(problem: Problem): Promise<any>;
	abstract openProblem(problem: Problem): Promise<any>;
	abstract fetchTests(problem: Problem): Promise<Test[]>;
	abstract fetchProblemAttributes(problem: Problem): Promise<any>;
}

export {
	APIProvider,
	supportedAPIProviders,
};
