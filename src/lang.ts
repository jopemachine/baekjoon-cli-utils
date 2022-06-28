const supportedLanguages = {
	cpp: {
		isCompiledLanguage: true,
		extensions: [
			'c',
			'h',
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

export {
	supportedLanguages,
	isSupportedLanguage,
};
