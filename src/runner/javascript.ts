import nvexeca from 'nvexeca';
import {TestRunner} from '../test-runner.js';

interface JavascriptTestRunnerSetting {
	nodeVersion: number | string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is JavascriptTestRunnerSetting => runnerSetting.nodeVersion;

class JavascriptTestRunner extends TestRunner {
	constructor(runnerSettings: any) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'javascript';
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const {childProcess} = await nvexeca(String(this.runnerSettings.nodeVersion), 'node', [targetFilePath], {input: stdin, timeout: this.timeout});
		return childProcess!;
	}
}

export {
	JavascriptTestRunner,
};
