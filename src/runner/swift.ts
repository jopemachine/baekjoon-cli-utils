import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {TestRunner} from '../test-runner.js';

interface SwiftTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is SwiftTestRunnerSetting => true;

class SwiftTestRunner extends TestRunner {
	constructor(runnerSettings: SwiftTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'swift';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa('swiftc', [sourceFilePath, '-o', temporaryFilePath]);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	SwiftTestRunner,
};
