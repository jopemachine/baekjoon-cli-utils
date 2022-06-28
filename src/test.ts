import path from 'node:path';
import del from 'del';
import {getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {openEditor, parsePath, pathExists, readFile, writeFile} from './utils.js';
import {FileIndexNotMatchError} from './errors.js';

const testFilePrefix = 'test';
const answerFilePrefix = 'answer';

const createAvailableTestFilePath = async (basePath: string, baseName: string) => {
	let tries = 1;

	/* eslint-disable no-await-in-loop, no-constant-condition */
	while (true) {
		const pth = path.resolve(basePath, `${baseName}_${tries.toString()}`);
		if (!(await pathExists(pth))) {
			return pth;
		}

		++tries;
	}
	/* eslint-enable no-await-in-loop, no-constant-condition */
};

const makeNewTestFile = async (problemUId: string) => createAvailableTestFilePath(path.resolve(getTestFilesPath(), problemUId), testFilePrefix);

const makeNewAnswerFile = async (problemUId: string) => createAvailableTestFilePath(path.resolve(getAnswerFilesPath(), problemUId), answerFilePrefix);

class Test {
	static async createManually(problemUId: string) {
		const testFilePath = await makeNewTestFile(problemUId);
		await writeFile(testFilePath, '');
		await openEditor(testFilePath);
		const {idx: testFileIdx} = parsePath(testFilePath);

		const answerFilePath = await makeNewAnswerFile(problemUId);
		await writeFile(answerFilePath, '');
		await openEditor(answerFilePath);
		const {idx: answerFileIdx} = parsePath(testFilePath);

		if (testFileIdx !== answerFileIdx) {
			throw new FileIndexNotMatchError();
		}

		return new Test({
			stdin: await readFile(testFilePath),
			expectedStdout: await readFile(answerFilePath),
			testIdx: testFileIdx,
			problemUId,
		});
	}

	problemUId: string;
	testIdx: number;
	stdin?: string;
	expectedStdout?: string;

	constructor({problemUId, testIdx, stdin, expectedStdout}: {problemUId: string; testIdx: number; stdin?: string; expectedStdout?: string}) {
		this.problemUId = problemUId;
		this.testIdx = testIdx;
		this.stdin = stdin;
		this.expectedStdout = expectedStdout;
	}

	async write() {
		if (!this.stdin || !this.expectedStdout) {
			throw new Error('Stdin or expected Stdout are not specified on the test.');
		}

		const testFilePath = this.getTestFilePath();
		const answerFilePath = this.getAnswerFilePath();

		if (await pathExists(testFilePath) || await pathExists(answerFilePath)) {
			throw new Error(`Matched test already exist on the path. The test index: ${this.testIdx}`);
		}

		await writeFile(testFilePath, this.stdin);
		await writeFile(answerFilePath, this.expectedStdout);
	}

	async clear() {
		const testFilePath = this.getTestFilePath();
		const answerFilePath = this.getAnswerFilePath();
		await del(testFilePath, {force: true});
		await del(answerFilePath, {force: true});
	}

	async parse() {
		const testFilePath = this.getTestFilePath();
		const answerFilePath = this.getAnswerFilePath();

		const testFileContent = await readFile(testFilePath);
		const answerFileContent = await readFile(answerFilePath);

		return {
			stdin: testFileContent, expectedStdout: answerFileContent,
		};
	}

	getTestFilePath() {
		return path.resolve(getTestFilesPath(), this.problemUId, `${testFilePrefix}_${this.testIdx}`);
	}

	getAnswerFilePath() {
		return path.resolve(getAnswerFilesPath(), this.problemUId, `${answerFilePrefix}_${this.testIdx}`);
	}
}

export {
	Test,
};
