import {Problem} from './problem.js';
import {readFile, writeFile} from './utils.js';
import {getSourceCodeTemplateFilePath} from './conf.js';
import {processTemplate} from './template.js';
import {useSpinner} from './spinner.js';

interface EndPoint {
	origin?: string;
	login?: string;
	getProblem?: string;
	getProblemTags?: string;
	getProblemLevel?: string;
	submitProblem?: string;
	cssSelectors?: Record<string, string>;
}

const supportedAPIProviders: string[] = [
	'baekjoon',
];

abstract class APIProvider {
	endPoints: EndPoint = {};

	async createProblem(problemPath: string, problem: Problem, langCode: string) {
		await this.fetchProblemInfo(problem);

		const sourceCodeTemplate = processTemplate(await readFile(getSourceCodeTemplateFilePath(langCode)), {
			...problem.problemInfo! as Record<string, string>,
			date: new Date().toLocaleString(),
		});

		await useSpinner(writeFile(problemPath, sourceCodeTemplate), 'Source Code Generating');
		await useSpinner(this.writeTests(problem), 'Test Files Generating');
	}

	abstract fetchProblemInfo(problem: Problem): Promise<void>;
	abstract openProblem(problemId: string): Promise<void>;
	abstract submitProblem(problemId: string, sourceCode: string): Promise<void>;

	private async writeTests(problem: Problem) {
		return Promise.all(problem.tests.map(async test => test.write()));
	}
}

export {
	APIProvider,
	supportedAPIProviders,
};
