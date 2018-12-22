// import i18next from 'i18next';

i18next
  .use(i18nextXHRBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: true,
    whitelist: ['de','en'],
    backend: {
      loadPath: 'locales/{{lng}}.json',
      crossDomain: true
    }
  }, function(err, t) {
    // init set content
    updateContent();
  });


// just set some content and react to language changes
// could be optimized using vue-i18next, jquery-i18next, react-i18next, ...
function updateContent() {
	document.getElementById("aboutmap").innerHTML = i18next.t('aboutmap');
	document.getElementById("zoomin").innerHTML = i18next.t('zoomin');
	document.title = i18next.t('website_title');
	document.getElementById("langselect").value = i18next.language;
}

function changeLng(lng) {
  i18next.changeLanguage(lng);
}

i18next.on('languageChanged', () => {
  updateContent();
});