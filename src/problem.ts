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
	problemPathId: string;
	problemInfo?: any;
	tests: Test[];

	constructor({problemId, problemPathId}: {problemId: string; problemPathId: string}) {
		this.problemId = problemId;
		this.problemPathId = problemPathId;
		this.problemInfo = null;
		this.tests = [];
	}

	generateTestFolder() {
		mkdirSync(path.resolve(getTestFilesPath(), this.problemPathId));
		mkdirSync(path.resolve(getAnswerFilesPath(), this.problemPathId));
	}

	async clearTest(testIdx: number) {
		await this.tests[testIdx - 1].clear();
	}

	async clearTests() {
		const problemTestDirectory = path.resolve(getTestFilesPath(), this.problemPathId);
		const problemAnswerDirectory = path.resolve(getAnswerFilesPath(), this.problemPathId);

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
				problemPathId: this.problemPathId,
			}));
		}
	}

	async fetchTests(apiProvider: APIProvider) {
		this.tests = [...this.tests, ...await apiProvider.fetchTests(this)];
	}

	async addManualTest() {
		this.tests.push(
			await Test.createManually(this.problemPathId),
		);
	}

	private async getTestFilePaths() {
		return globby(path.resolve(getTestFilesPath(), this.problemPathId), {caseSensitiveMatch: true, onlyFiles: true, followSymbolicLinks: false});
	}

	private async getAnswerFilePaths() {
		return globby(path.resolve(getAnswerFilesPath(), this.problemPathId), {caseSensitiveMatch: true, onlyFiles: true, followSymbolicLinks: false});
	}
}

export {
	Problem,
};
