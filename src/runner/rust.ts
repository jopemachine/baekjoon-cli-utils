import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {TestRunner} from '../test-runner.js';

interface RustTestRunnerSetting {
	rustEdition: number;
}

const isValidConfig = (runnerSetting: any): runnerSetting is RustTestRunnerSetting => runnerSetting.rustEdition;

class RustTestRunner extends TestRunner {
	constructor(runnerSettings: RustTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'rust';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa('rustc', [`--edition=${String(this.runnerSettings.rustEdition)}`, '-o', temporaryFilePath, sourceFilePath]);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	RustTestRunner,
};
