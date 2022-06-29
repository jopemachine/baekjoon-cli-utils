import open from 'open';
import got from 'got';
import {load} from 'cheerio';
import htmlToText from 'html-to-text';
import {APIProvider} from '../api-provider.js';
import {Problem} from '../problem.js';
import {Test} from '../test.js';

class BaekjoonProvider extends APIProvider {
	constructor() {
		super();
		this.endPoints = {
			getProblem: 'https://www.acmicpc.net/problem/',
		};
	}

	async fetchProblemInfo(problem: Problem) {
		const result = await got([this.endPoints.getProblem!, problem.problemId].join('/'));
		const problemInfo = load(result.body);

		for (let testIdx = 1; ; ++testIdx) {
			const sampleInput = problemInfo(`#sample-input-${testIdx}`);
			const sampleOutput = problemInfo(`#sample-output-${testIdx}`);
			const sampleInputTxt = sampleInput.text();
			const sampleOutputTxt = sampleOutput.text();

			if (!sampleInputTxt || !sampleOutputTxt) {
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
			title: problemInfo('#problem_title').text(),
			text: htmlToText.convert(problemInfo('#problem_description').text(), {
				wordwrap: 130,
			}),
		};
	}

	async openProblem(problemId: string) {
		await open(`${this.endPoints.getProblem}/${problemId}`, {wait: false});
	}
}

export {
	BaekjoonProvider,
};
