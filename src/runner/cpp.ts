import path from 'node:path';
import stream from 'node:stream';
import {execaCommand} from 'execa';
import {temporaryDirectory} from 'tempy';
import {TestRunner} from '../test-runner.js';

class CppTestRunner extends TestRunner {
	constructor() {
		super({isCompiledLanguage: false});
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryDirPath = temporaryDirectory();
		await execaCommand(`g++ -std=gnu++17 ${sourceFilePath} --output=${temporaryDirPath}`);
		return path.resolve(temporaryDirPath, 'a.out');
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const stdinStream = new stream.Readable();

		stdinStream.push(stdin);
		// Signals the end of the stream (EOF)
		// eslint-disable-next-line
		stdinStream.push(null);

		const childProc = execaCommand(`${targetFilePath} `);
		stdinStream.pipe(childProc.stdin!);
		return childProc;
	}
}

export {
	CppTestRunner,
};
