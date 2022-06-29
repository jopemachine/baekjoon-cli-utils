interface LanguageInfo {
	isCompiledLanguage: boolean;
	extensions: string[];
	extension: string;
}

const supportedLanguages: Record<string, LanguageInfo> = {
	cpp: {
		isCompiledLanguage: true,
		extensions: [
			'cpp',
			'hpp',
		],
		extension: 'cpp',
	},
	javascript: {
		isCompiledLanguage: false,
		extensions: [
			'js',
		],
		extension: 'js',
	},
	python: {
		isCompiledLanguage: false,
		extensions: [
			'py',
		],
		extension: 'py',
	},
	go: {
		isCompiledLanguage: true,
		extensions: [
			'go',
		],
		extension: 'go',
	},
	java: {
		isCompiledLanguage: true,
		extensions: [
			'java',
		],
		extension: 'java',
	},
	swift: {
		isCompiledLanguage: true,
		extensions: [
			'swift',
		],
		extension: 'swift',
	},
	kotlin: {
		isCompiledLanguage: true,
		extensions: [
			'kt',
		],
		extension: 'kt',
	},
	ruby: {
		isCompiledLanguage: false,
		extensions: [
			'rb',
		],
		extension: 'rb',
	},
	d: {
		isCompiledLanguage: true,
		extensions: [
			'd',
		],
		extension: 'd',
	},
	c: {
		isCompiledLanguage: true,
		extensions: [
			'c',
			'h',
		],
		extension: 'c',
	},
	rust: {
		isCompiledLanguage: true,
		extensions: [
			'rs',
		],
		extension: 'rs',
	},
};

const isSupportedLanguage = (lang: string) =>
	Object.keys(supportedLanguages).includes(lang);

const inferLanguageCode = (extension: string) => {
	for (const langCode of Object.keys(supportedLanguages)) {
		if (supportedLanguages[langCode].extensions.includes(extension)) {
			return langCode;
		}
	}

	throw new Error(`Unsupported file extension: ${extension}`);
};

export {
	supportedLanguages,
	inferLanguageCode,
	isSupportedLanguage,
};
