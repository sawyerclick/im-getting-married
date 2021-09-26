import en from '$locales/en.json';
import es from '$locales/es.json';
const supportedLangs = {
	en: en,
	es: es
};
const keys = Object.keys(supportedLangs);

export const get = async ({ params }) => {
	const { lang } = params;
	const { invitation } = supportedLangs[lang];
	const otherLangs = keys.filter((d) => d !== lang);
	const body = { invitation, otherLangs };
	return { body };
};
