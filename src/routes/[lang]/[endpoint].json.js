import en from '$locales/en.json';
import es from '$locales/es.json';
const supportedLangs = {
	en: en,
	es: es
};
const keys = Object.keys(supportedLangs);

export const get = async ({ params }) => {
	const { lang, endpoint } = params;
	const page = supportedLangs[lang][endpoint];
	const otherLangs = keys.filter((d) => d !== lang);
	const body = { page, otherLangs };
	return { body };
};
