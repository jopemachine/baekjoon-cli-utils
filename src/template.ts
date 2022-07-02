const processCodeSourceTemplate = (template: string, problemInfoDict: Record<string, string>) => {
	let result = template;

	for (const problemInfoKey of Object.keys(problemInfoDict)) {
		result = result.replace(`{${problemInfoKey}}`, (problemInfoDict as any)[problemInfoKey]);
	}

	return result;
};

export {
	processCodeSourceTemplate,
};
