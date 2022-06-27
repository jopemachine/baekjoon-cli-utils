import path from 'node:path';
import {execa} from 'execa';
import del from 'del';
import {defaultEditor, getAnswerFilesPath, getTestFilesPath} from './conf.js';
import {parsePath, pathExists, readFile, writeFile} from './utils.js';
import {FileIndexNotMatchError} from './errors.js';

const testFilePrefix = 'test';
const answerFilePrefix = 'answer';

const createAvailableTestFilePath = async (basePath: string, basename: string) => {
	let tries = 1;

	/* eslint-disable no-await-in-loop, no-constant-condition */
	while (true) {
		const pth = path.resolve(basePath, `${basename}_${tries.toString()}`);
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
		await execa(defaultEditor, [testFilePath]);
		const {idx: testFileIdx} = parsePath(testFilePath);

		const answerFilePath = await makeNewAnswerFile(problemUId);
		await writeFile(answerFilePath, '');
		await execa(defaultEditor, [answerFilePath]);
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
		return path.resolve(getTestFilesPath(), this.problemUId, `${answerFilePrefix}_${this.testIdx}`);
	}
}

export {
	Test,
};
