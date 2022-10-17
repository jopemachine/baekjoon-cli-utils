import path from 'node:path';
import {globby} from 'globby';
import del from 'del';
import {pathExistsSync} from 'find-up';
import {getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {answerFilePrefix, Test} from './test.js';
import {FileIndexNotMatchError} from './errors.js';
import {mkdirSync, readFile} from './utils.js';

interface ProblemProperties {
	id?: string;
	url?: string;
	title?: string;
	text?: string;
	input?: string;
	output?: string;
	tags?: string;
	level?: string;
}

class Problem {
	problemId: string;
	problemPathId: string;
	problemInfo?: ProblemProperties;
	tests: Test[];

	constructor({problemId, problemPathId}: {problemId: string; problemPathId: string}) {
		this.problemId = problemId;
		this.problemPathId = problemPathId;
		this.tests = [];
	}

	generateTestFolder() {
		const testFolderPath = path.resolve(getTestFilesPath(), this.problemPathId);
		const answerFolderPath = path.resolve(getAnswerFilesPath(), this.problemPathId);

		if (!pathExistsSync(testFolderPath)) {
			mkdirSync(testFolderPath);
		}

		if (!pathExistsSync(answerFolderPath)) {
			mkdirSync(answerFolderPath);
		}
	}

	async clearTest(testIdx: number) {
		for (const test of this.tests) {
			if (test.testIdx === testIdx) {
				return test.clear();
			}
		}

		throw new Error(`Test ${testIdx} not found!`);
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

		for await (const testFilePath of testFilePaths) {
			const testIdx = Number(path.parse(testFilePath).name.split('_')[1]);

			const stdin = (await readFile(testFilePath)).trim();
			const expectedStdout = (await readFile(path.resolve(getAnswerFilesPath(), this.problemPathId, `${answerFilePrefix}_${testIdx}`))).trim();

			this.tests.push(new Test({
				testIdx,
				problemPathId: this.problemPathId,
				stdin,
				expectedStdout,
			}));
		}
	}

	async addManualTest() {
		const newTest = await Test.createManually(this.problemPathId);
		this.tests.push(newTest);
		return newTest;
	}

	private async getTestFilePaths() {
		return (await globby(`${this.problemPathId}/**`, {
			cwd: getTestFilesPath(),
			caseSensitiveMatch: true,
			followSymbolicLinks: false,
		})).map((pth: string) => path.resolve(getTestFilesPath(), pth));
	}

	private async getAnswerFilePaths() {
		return (await globby(`${this.problemPathId}/**`, {
			cwd: getAnswerFilesPath(),
			caseSensitiveMatch: true,
			followSymbolicLinks: false,
		})).map((pth: string) => path.resolve(getAnswerFilesPath(), pth));
	}
}

export {
	Problem,
};
