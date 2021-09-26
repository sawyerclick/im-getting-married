import supportedLanguages from '$locales/supportedLanguages';
const DOCUMENT_REGEX = /^([^.?#@]+)?([?#](.+)?)?$/;

export function getContext({ headers, path }) {
	const isDocument = DOCUMENT_REGEX.test(path);
	if (!isDocument) return;

	let language = path.split('/')[1];
	// language not in url
	if (supportedLanguages.indexOf(language) === -1) {
		language = supportedLanguages[0];

		if (headers['accept-language']) {
			const headerLang = headers['accept-language'].split(',')[0].trim().slice(0, 2);

			if (headerLang && headerLang.length > 1) {
				if (supportedLanguages.indexOf(headerLang) !== -1) language = headerLang;
			}
		}
	}

	return { language };
}

export function getSession({ context }) {
	const { language } = context;
	return { language };
}

export async function handle({ request, render }) {
	const rendered = await render(request);

	if (rendered.headers['content-type'] === 'text/html') {
		const { language } = request.context;

		return {
			...rendered,
			body: rendered.body.replace('%lang%', language)
		};
	}

	return rendered;
}
