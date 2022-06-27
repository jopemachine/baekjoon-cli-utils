import path from 'node:path';
import chalk from 'chalk';
import {globby} from 'globby';
import del from 'del';
import {getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {APIProvider} from './api-provider.js';
import {Test} from './test.js';
import {getUnusedFilename, Logger, mkdir, parsePath} from './utils.js';
import {FileIndexNotMatchError} from './errors.js';

const makeNewTestDir = async (problemId: string) => getUnusedFilename(path.resolve(getTestFilesPath(), problemId));

const makeNewAnswerDir = async (problemId: string) => getUnusedFilename(path.resolve(getAnswerFilesPath(), problemId));

class Problem {
	static async create(problemId: string) {
		const problemTestDirectory = await makeNewTestDir(problemId);
		const problemAnswerDirectory = await makeNewAnswerDir(problemId);

		const {idx: testDirIdx} = parsePath(problemTestDirectory);
		const {idx: answerDirIdx} = parsePath(problemAnswerDirectory);

		if (testDirIdx !== answerDirIdx) {
			throw new FileIndexNotMatchError();
		}

		await mkdir(problemTestDirectory);
		await mkdir(problemAnswerDirectory);

		Logger.successLog(chalk.gray('Added Problem Successfully.'));

		return new Problem({
			problemId,
			problemIdx: testDirIdx,
		});
	}

	problemId: string;
	problemIdx?: number;
	problemInfo?: any;
	tests: Test[];

	constructor({problemId, problemIdx}: {problemId: string; problemIdx?: number}) {
		this.problemId = problemId;
		this.problemIdx = problemIdx;
		this.problemInfo = null;
		this.tests = [];
	}

	setProblemIndex(index: number) {
		this.problemIdx = index;
	}

	async clearTest(testIdx: number) {
		await this.tests[testIdx - 1].clear();
	}

	async clearTests() {
		const problemTestDirectory = path.resolve(getTestFilesPath(), this.getProblemUId());
		const problemAnswerDirectory = path.resolve(getAnswerFilesPath(), this.getProblemUId());

		await del(problemTestDirectory, {force: true});
		await del(problemAnswerDirectory, {force: true});
	}

	async readAllTests() {
		this.tests = [];

		const testFilePaths = await this.getTestFilePaths();
		const answerFilePaths = await this.getAnswerFilePaths();

		if (testFilePaths.length !== answerFilePaths.length) {
			throw new FileIndexNotMatchError();
		}

		for (const testFilePath of testFilePaths) {
			const testIdx = Number(path.parse(testFilePath).name.split('_')[1]);

			this.tests.push(new Test({
				testIdx,
				problemUId: this.getProblemUId(),
			}));
		}
	}

	async fetchTests(apiProvider: APIProvider) {
		this.tests = [...this.tests, ...await apiProvider.fetchTests(this)];
	}

	getProblemUId() {
		if (this.problemIdx) {
			return [this.problemId, '_', this.problemIdx].join('');
		}

		return this.problemId;
	}

	async addManualTest() {
		this.tests.push(
			await Test.createManually(this.getProblemUId()),
		);
	}

	private async getTestFilePaths() {
		return globby(path.resolve(getTestFilesPath(), this.getProblemUId()));
	}

	private async getAnswerFilePaths() {
		return globby(path.resolve(getAnswerFilesPath(), this.getProblemUId()));
	}
}

export {
	Problem,
};
