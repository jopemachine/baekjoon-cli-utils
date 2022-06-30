import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {TestRunner} from '../test-runner.js';

interface GoLangTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is GoLangTestRunnerSetting => true;

class GoTestRunner extends TestRunner {
	constructor(runnerSettings: GoLangTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'go';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa('go', ['build', '-o', temporaryFilePath, sourceFilePath]);
		this.resources.push(temporaryFilePath);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	GoTestRunner,
};
