const locales = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
};

const DEFAULT_LANG = 'en';

function pickLang(query) {
  const requested = typeof query === 'string' ? query : DEFAULT_LANG;
  return Object.prototype.hasOwnProperty.call(locales, requested) ? requested : DEFAULT_LANG;
}

exports.page = (req, res) => {
  const lang = pickLang(req.query.lang);
  const t = locales[lang];
  const today = new Intl.DateTimeFormat(t.dateLocale, { dateStyle: 'full' }).format(new Date());

  const questions = t.questions
    .map(
      (q, i) => `
      <label for="q${i + 1}">${i + 1}. ${q}</label>
      <textarea id="q${i + 1}" name="q${i + 1}" rows="4" required></textarea>`
    )
    .join('');

  res.type('html').send(`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
    label { display: block; margin-top: 18px; font-weight: bold; }
    textarea { width: 100%; font-size: 15px; margin-top: 6px; }
    button { margin-top: 20px; padding: 8px 18px; font-size: 16px; }
    .thanks { margin-top: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <p><a href="/feedback?lang=en">English</a> | <a href="/feedback?lang=fr">Français</a></p>
  <h1>${t.title}</h1>
  <p>${t.dateLabel}: ${today}</p>
  <p>${t.instructions}</p>
  <form onsubmit="event.preventDefault(); this.querySelector('.thanks').hidden = false;">
    ${questions}
    <button type="submit">${t.submit}</button>
    <p class="thanks" hidden>${t.thanks}</p>
  </form>
</body>
</html>`);
};