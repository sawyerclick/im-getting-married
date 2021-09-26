import { supportedLanguages } from '$stores';

// get preferred language from browser and store for redirect
export function getSession({ headers }) {
	if (headers['accept-language']) {
		const acceptedLanguages = headers['accept-language'];
		const preferredLanguage = acceptedLanguages.split(',')[0];
		const code = preferredLanguage.split('-')[0];
		return {
			lang: code
		};
	} else
		return {
			// set default language
			lang: 'en'
		};
}
