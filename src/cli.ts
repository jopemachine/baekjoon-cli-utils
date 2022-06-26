import process from 'node:process';
import cleanStack from 'clean-stack';
import {checkHealth, setProgrammingLanguage, setCommentTemplate, setSourceCodeTemplate} from './conf.js';

const command = process.argv[2];

(async function () {
	try {
		if (command === 'set') {
			const target = process.argv[3];

			switch (target) {
				case 'lang':
					setProgrammingLanguage(process.argv[4]);
					break;
				case 'code':
					await setSourceCodeTemplate();
					break;
				case 'comment':
					await setCommentTemplate();
					break;
				default:
					throw new Error('Unknown Config');
			}
		} else {
			checkHealth();

			const problemNumber = process.argv[3];

			switch (command) {
				case 'run':
				case 'test':
					break;
				case 'addTest':
					break;
				case 'open':
					break;
				case 'commit':
					break;
				case 'clear':
					break;
				case 'create':
					break;
				default:
					throw new Error('Unknown Command');
			}
		}
	} catch (error: any) {
		cleanStack(error.stack);
	}
})();
