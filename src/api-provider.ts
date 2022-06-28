import path from 'node:path';
import {execa} from 'execa';
import {Problem} from './problem.js';
import {readFile, writeFile} from './utils.js';
import {config, getCommentTemplateFilePath, getSourceCodeTemplateFilePath} from './conf.js';
import {Test} from './test.js';
import {processCommentTemplate} from './template.js';
import {useSpinner} from './spinner.js';

interface EndPoint {
	getProblem?: string;
}

const supportedAPIProviders: string[] = [
	'baekjoon',
];

abstract class APIProvider {
	endPoints: EndPoint = {};

	async createProblem(problemPath: string, problem: Problem) {
		const lang = config.get('lang');
		const {title} = await useSpinner(this.fetchProblemAttributes(problem), 'Fetching Problem Information from Baekjoon');

		const sourceCodeTemplate = await readFile(getSourceCodeTemplateFilePath(lang));
		const commentTemplate = processCommentTemplate(await readFile(getCommentTemplateFilePath(lang)), {
			title,
		});

		await writeFile(problemPath, `${commentTemplate}\n${sourceCodeTemplate}`);
		const tests = await useSpinner(this.fetchTests(problem), 'Fetching Test');
		await useSpinner(this.writeTests(tests!), 'Test Files Generating');
	}

	async commitProblem(problemId: string, problemPath: string) {
		const {dir} = path.parse(problemPath);

		useSpinner(async () => {
			await execa('git', ['add', problemPath]);
			await execa('git', ['commit', '-m', `[${dir}] Solve ${problemId}`]);
		}, 'Git commit');
	}

	abstract fetchProblemInfo(problem: Problem): Promise<any>;
	abstract openProblem(problemId: string): Promise<any>;
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
