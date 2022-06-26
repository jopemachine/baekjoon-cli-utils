import process from 'node:process';
import path from 'node:path';
import {unusedFilename} from 'unused-filename';
import chalk from 'chalk';
import {execa, execaCommand} from 'execa';
import {globby} from 'globby';
import logSymbols from 'log-symbols';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import {Problem} from './problem.js';
import {readFile, unusedFileNameIncrementer, writeFile} from './utils.js';
import {config} from './conf.js';
import {Test} from './test.js';
import {processCommentTemplate} from './template.js';

abstract class APIProvider {
	async createProblem(problem: Problem) {
		const problemId = problem.problemId;
		let paths = await globby('**/*', {
			onlyDirectories: true,
		});

		inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

		paths = [(await inquirer.prompt([{
			name: 'folder',
			message: 'Select An Folder To Save The File',
			type: 'autocomplete',
			pageSize: 10,
			source: (_answers: any[], input: string) => this.getProblemFolderNames(paths, input),
		}])).folder];

		const {title} = await this.fetchProblemAttributes(problem);

		const pathToSave = await unusedFilename(
			path.resolve(paths[0], [problemId, config.get('extension')].join('.'))
			, {
				incrementer: unusedFileNameIncrementer,
			});

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
		const problemId = problem.problemId;
		let paths = await globby(`**/${problemId}*.*`);

		if (paths.length === 0) {
			console.error(`${logSymbols.error} Failed To Find '${problemId}'`);
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
		await execaCommand('git push origin master');
		console.log(`${logSymbols.success} '${paths[0]}' Committed Successfully.`);
	}

	abstract fetchProblemInfo(problem: Problem): Promise<any>;
	abstract openProblem(problem: Problem): Promise<any>;
	abstract fetchTests(problem: Problem): Promise<Test[]>;
	abstract fetchProblemAttributes(problem: Problem): Promise<any>;
}

export {
	APIProvider,
};
