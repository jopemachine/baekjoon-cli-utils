import path from 'node:path';
import process from 'node:process';
import {execa} from 'execa';
import {globby} from 'globby';
import inquirer from 'inquirer';
import {Problem} from './problem.js';
import {Logger, readFile, writeFile, getUnusedFilename, findProblemPath, parsePath} from './utils.js';
import {config, getCommentTemplateFilePath, getSourceCodeTemplateFilePath} from './conf.js';
import {Test} from './test.js';
import {processCommentTemplate} from './template.js';
import {supportedLanguages} from './lang.js';

interface EndPoint {
	getProblem?: string;
}

const supportedAPIProviders: string[] = [
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
			message: 'Select An Folder To Save The File',
			type: 'autocomplete',
			pageSize: 8,
			source: (_answers: any[], input: string) => this.getProblemFolderNames(paths, input),
		}])).folder];

		const lang = config.get('lang');
		const {title} = await this.fetchProblemAttributes(problem);
		const {extension} = (supportedLanguages as any)[lang];

		const pathToSave = await getUnusedFilename(
			path.resolve(paths[0], [problemId, extension].join('.')),
		);

		const {idx: problemIndex} = parsePath(pathToSave);
		problem.setProblemIndex(problemIndex);

		const sourceCodeTemplate = await readFile(getSourceCodeTemplateFilePath(lang));
		const commentTemplate = processCommentTemplate(await readFile(getCommentTemplateFilePath(lang)), {
			title,
		});

		await writeFile(pathToSave, `${commentTemplate}\n${sourceCodeTemplate}`);
		const tests = await this.fetchTests(problem);
		await this.writeTests(tests);
	}

	getProblemFolderNames(paths: string[], input: string) {
		return paths.filter(path => !input || path.toLowerCase().includes(input.toLowerCase())).map(path => ({
			name: path.split(`${process.cwd()}/`)[1],
			value: path,
		}));
	}

	async commitProblem(problem: Problem) {
		const {problemId} = problem;
		const problemPath = await findProblemPath(problemId);

		const {dir} = path.parse(problemPath);
		await execa('git', ['add', problemPath]);
		await execa('git', ['commit', '-m', `[${dir}] Solve ${problemId}`]);
		Logger.successLog(`'${problemPath}' Committed Successfully.`);
	}

	abstract fetchProblemInfo(problem: Problem): Promise<any>;
	abstract openProblem(problem: Problem): Promise<any>;
	abstract fetchTests(problem: Problem): Promise<Test[]>;
	abstract fetchProblemAttributes(problem: Problem): Promise<any>;

	private async writeTests(tests: Test[]) {
		await Promise.all(tests.map(async test => test.write()));
	}
}

export {
	APIProvider,
	supportedAPIProviders,
};
