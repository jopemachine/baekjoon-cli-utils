import path from 'node:path';
import {execa} from 'execa';
import {temporaryDirectory} from 'tempy';
import {TestRunner} from '../test-runner.js';
import {cpFile} from '../utils.js';

interface JavaTestRunnerSetting {
	javaVersion: number | string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is JavaTestRunnerSetting => runnerSetting.javaVersion;

class JavaTestRunner extends TestRunner {
	constructor(runnerSettings: JavaTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
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

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa('java', ['-Dfile.encoding=UTF-8', '-XX:+UseSerialGC', '-classpath', path.parse(targetFilePath).dir, 'Main'], {input: stdin});
		return childProc;
	}
}

export {
	JavaTestRunner,
};
