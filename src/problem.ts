import path from 'node:path';
import {globby} from 'globby';
import del from 'del';
import {getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {APIProvider} from './api-provider.js';
import {Test} from './test.js';
import {FileIndexNotMatchError} from './errors.js';
import {mkdirSync} from './utils.js';

class Problem {
	problemId: string;
	problemUId: string;
	problemInfo?: any;
	tests: Test[];

	constructor({problemId, problemUId}: {problemId: string; problemUId: string}) {
		this.problemId = problemId;
		this.problemUId = problemUId;
		this.problemInfo = null;
		this.tests = [];
	}

	generateTestFolder() {
		mkdirSync(path.resolve(getTestFilesPath(), this.problemUId));
		mkdirSync(path.resolve(getAnswerFilesPath(), this.problemUId));
	}

	async clearTest(testIdx: number) {
		await this.tests[testIdx - 1].clear();
	}

	async clearTests() {
		const problemTestDirectory = path.resolve(getTestFilesPath(), this.problemUId);
		const problemAnswerDirectory = path.resolve(getAnswerFilesPath(), this.problemUId);

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
				problemUId: this.problemUId,
			}));
		}
	}

	async fetchTests(apiProvider: APIProvider) {
		this.tests = [...this.tests, ...await apiProvider.fetchTests(this)];
	}

	async addManualTest() {
		this.tests.push(
			await Test.createManually(this.problemUId),
		);
	}

	private async getTestFilePaths() {
		return globby(path.resolve(getTestFilesPath(), this.problemUId), {caseSensitiveMatch: true, onlyFiles: true, followSymbolicLinks: false});
	}

	private async getAnswerFilePaths() {
		return globby(path.resolve(getAnswerFilesPath(), this.problemUId), {caseSensitiveMatch: true, onlyFiles: true, followSymbolicLinks: false});
	}
}

export {
	Problem,
};
