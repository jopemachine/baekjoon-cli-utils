import process from 'node:process';
import {temporaryFile} from 'tempy';
import nvexeca from 'nvexeca';
import {TestRunner} from '../test-runner.js';
import {readFile, writeFile} from '../utils.js';
import {RunnerConfigFileNotValidError} from '../errors.js';

interface JavascriptTestRunnerSetting {
	nodeVersion: number | string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is JavascriptTestRunnerSetting => runnerSetting.nodeVersion;

class JavascriptTestRunner extends TestRunner {
	constructor(runnerSettings: any) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'javascript';
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		// `fs.readFileSync("/dev/stdin")` should be replaced with stdin directly in Windows because the path not exist.
		if (process.platform === 'win32') {
			stdin = stdin.replaceAll('`', '\\`');
			const replaced = (await readFile(targetFilePath)).replaceAll('fs.readFileSync("/dev/stdin")', `\`${stdin}\`.trim()`);

			targetFilePath = temporaryFile();
			await writeFile(targetFilePath, replaced);
			this.resources.push(targetFilePath);
		}

		const {childProcess} = await nvexeca(String(this.runnerSettings.nodeVersion), 'node', [targetFilePath], {input: stdin, timeout: this.timeout});
		return childProcess!;
	}
}

export {
	JavascriptTestRunner,
};
