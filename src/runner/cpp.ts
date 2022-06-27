import stream from 'node:stream';
import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {TestRunner} from '../test-runner.js';

class CppTestRunner extends TestRunner {
	constructor() {
		super();
		this.languageId = 'cpp';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa('g++', ['--std=gnu++17', `--output=${temporaryFilePath}`, sourceFilePath]);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const stdinStream = new stream.Readable();

		stdinStream.push(stdin);
		// Signals the end of the stream (EOF)
		// eslint-disable-next-line
		stdinStream.push(null);

		const childProc = execa(targetFilePath, { timeout: 2000 });
		stdinStream.pipe(childProc.stdin!);
		return childProc;
	}
}

export {
	CppTestRunner,
};
