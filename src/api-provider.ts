import {Problem} from './problem.js';
import {readFile, writeFile} from './utils.js';
import {config, getCommentTemplateFilePath, getSourceCodeTemplateFilePath} from './conf.js';
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
		await this.fetchProblemInfo(problem);

		const lang = config.get('lang');

		const sourceCodeTemplate = await readFile(getSourceCodeTemplateFilePath(lang));
		const commentTemplate = processCommentTemplate(await readFile(getCommentTemplateFilePath(lang)), (problem.problemInfo! as Record<string, string>));

		await useSpinner(writeFile(problemPath, `${commentTemplate}\n${sourceCodeTemplate}`), 'Source Code Generating');
		await useSpinner(this.writeTests(problem), 'Test Files Generating');
	}

	abstract fetchProblemInfo(problem: Problem): Promise<void>;
	abstract openProblem(problemId: string): Promise<void>;

	private async writeTests(problem: Problem) {
		await Promise.all(problem.tests.map(async test => test.write()));
	}
}

export {
	APIProvider,
	supportedAPIProviders,
};
