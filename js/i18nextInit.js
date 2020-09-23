// import i18next from 'i18next';

i18next
  .use(i18nextXHRBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: false,
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
  $("#aboutmap").html(i18next.t('aboutmap'));
  $("#zoomin").html(i18next.t('zoomin'));
  document.title = i18next.t('website_title');
  $("#langselect").attr('value', i18next.language);
  $("#opacity_slider").attr('title', i18next.t("opacity_select"));
  $("#lang").attr('title', i18next.t("lang_select"));
  $("#layer_street_lights").html(i18next.t("layer_street_lights"));
}

function changeLng(lng) {
  i18next.changeLanguage(lng);
}

i18next.on('languageChanged', () => {
  updateContent();
});
$(document).ready(updateContent());