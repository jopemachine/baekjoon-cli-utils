import path from 'node:path';
import chalk from 'chalk';
import {globby} from 'globby';
import del from 'del';
import {unusedFilename} from 'unused-filename';
import {getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {APIProvider} from './api-provider.js';
import {Test} from './test.js';
import {mkdir, parsePath, unusedFileNameIncrementer} from './utils.js';

const makeNewTestDir = async (problemId: string) => unusedFilename(path.resolve(getTestFilesPath(), problemId), {incrementer: unusedFileNameIncrementer});

const makeNewAnswerDir = async (problemId: string) => unusedFilename(path.resolve(getAnswerFilesPath(), problemId), {incrementer: unusedFileNameIncrementer});

class Problem {
	static async create(problemId: string) {
		const problemTestDirectory = await makeNewTestDir(problemId);
		const problemAnswerDirectory = await makeNewAnswerDir(problemId);

		const {idx: testFileIdx} = parsePath(problemTestDirectory);
		const {idx: answerFileIdx} = parsePath(problemAnswerDirectory);

		if (testFileIdx !== answerFileIdx) {
			throw new Error('FileIndex not matched. You can try to clear tests and fetch again.');
		}

		await mkdir(problemTestDirectory);
		await mkdir(problemAnswerDirectory);

		console.log(chalk.gray('Added Problem Successfully.'));

		return new Problem({
			problemId,
			problemIdx: testFileIdx,
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

	async clear(testIdx: number) {
		this.tests[testIdx - 1].clear();
	}

	async clearTests() {
		const problemTestDirectory = path.resolve(getTestFilesPath(), this.getProblemUId());
		const problemAnswerDirectory = path.resolve(getTestFilesPath(), this.getProblemUId());

		await del(problemTestDirectory, {force: true});
		await del(problemAnswerDirectory, {force: true});
	}

	async readAllTests() {
		this.tests = [];

		const testFilePaths = await this.getTestFilePaths();
		const answerFilePaths = await this.getAnswerFilePaths();

		if (testFilePaths.length !== answerFilePaths.length) {
			throw new Error('FileIndex not matched. You can try to clear tests and fetch again.');
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
			return [this.problemId, '_', this.problemIdx].join(',');
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
