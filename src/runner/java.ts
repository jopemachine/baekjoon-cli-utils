import path from 'node:path';
import process from 'node:process';
import {execa} from 'execa';
import {temporaryDirectory} from 'tempy';
import {TestRunner} from '../test-runner.js';
import {cpFile} from '../utils.js';
import {RunnerConfigFileNotValidError} from '../errors.js';

interface JavaTestRunnerSetting {
	javaVersion: number | string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is JavaTestRunnerSetting => runnerSetting.javaVersion;

class JavaTestRunner extends TestRunner {
	constructor(runnerSettings: JavaTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'java';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryDirPath = temporaryDirectory();
		const temporaryFilePath = path.resolve(temporaryDirPath, 'Main.java');
		await cpFile(sourceFilePath, temporaryFilePath);
		await execa('javac', ['--release', String(this.runnerSettings.javaVersion), '-encoding', 'UTF-8', '-d', temporaryDirPath, temporaryFilePath]);
		this.resources.push(temporaryDirPath);
		return path.resolve(temporaryDirPath, 'Main.class');
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa('java', ['-Dfile.encoding=UTF-8', '-XX:+UseSerialGC', '-classpath', path.parse(targetFilePath).dir, 'Main'], {input: stdin});
		if (this.rawMode) {
			childProc.stdout!.pipe(process.stdout);
		}

		return childProc;
	}
}

export {
	JavaTestRunner,
};
