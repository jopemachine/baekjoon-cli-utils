import process from 'node:process';
import open from 'open';
import got, {Response} from 'got';
import {load} from 'cheerio';
import htmlToText from 'html-to-text';
import {APIProvider} from '../api-provider.js';
import {Problem} from '../problem.js';
import {Test} from '../test.js';
import {Logger} from '../utils.js';

class BaekjoonProvider extends APIProvider {
	constructor() {
		super();
		this.endPoints = {
			getProblem: 'https://www.acmicpc.net/problem',
			cssSelectors: {
				title: '#problem_title',
				input: '#problem_input',
				output: '#problem_output',
				description: '#problem_description',
				testInput: '#sample-input',
				testOutput: '#sample-output',
			},
		};
	}

	override async fetchProblemInfo(problem: Problem) {
		let response: Response<string>;

		try {
			response = await got([this.endPoints.getProblem!, problem.problemId].join('/'));
		} catch (error: any) {
			if (error.code === 'ERR_NON_2XX_3XX_RESPONSE') {
				Logger.errorLog('Problem not found in the provider server.\nPlease check if your problem identifier is valid.');
				process.exit(1);
			}
		}

		const problemInfo = load(response!.body);

		for (let testIdx = 1; ; ++testIdx) {
			const sampleInput = problemInfo(`${this.endPoints.cssSelectors!.testInput}-${testIdx}`);
			const sampleOutput = problemInfo(`${this.endPoints.cssSelectors!.testOutput}-${testIdx}`);
			const sampleInputTxt = sampleInput.text();
			const sampleOutputTxt = sampleOutput.text();

			if (!sampleInputTxt && !sampleOutputTxt) {
				break;
			}

			problem.tests.push(
				new Test({
					testIdx,
					problemPathId: problem.problemPathId,
					stdin: sampleInputTxt,
					expectedStdout: sampleOutputTxt,
				}),
			);
		}

		problem.problemInfo = {
			id: problem.problemId,
			title: problemInfo(this.endPoints.cssSelectors!.title).text(),
			text: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.description).text(), {
				wordwrap: 75,
			}),
			input: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.input).text(), {
				wordwrap: 75,
			}),
			output: htmlToText.convert(problemInfo(this.endPoints.cssSelectors!.output).text(), {
				wordwrap: 75,
			}),
			url: [this.endPoints.getProblem!, problem.problemId].join('/'),
		};
	}

	override async openProblem(problemId: string) {
		await open(`${this.endPoints.getProblem}/${problemId}`, {wait: false});
	}
}

export {
	BaekjoonProvider,
};
