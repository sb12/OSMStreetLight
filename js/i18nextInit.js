// import i18next from 'i18next';

i18next
  .use(i18nextBrowserLanguageDetector)
  .use(i18nextHttpBackend)
  .init({
    fallbackLng: 'en',
    whitelist: ['de','en','nl', 'ru'],
    debug: true,
    detection: {
      order: ['cookie', 'localStorage'],
      lookupCookie: 'next-i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['cookie', 'localStorage']
    },
    backend: {
      loadPath: 'locales/{{lng}}.json',
      crossDomain: true
    }
  });


// just set some content and react to language changes
// could be optimized using vue-i18next, jquery-i18next, react-i18next, ...
function updateContent() {
  $("#aboutmap").html(i18next.t('aboutmap'));
  $("#zoomin").html(i18next.t('zoomin'));
  document.title = i18next.t('website_title');
  $("#langselect").val(i18next.language);
  $("#opacity_slider").attr('title', i18next.t("opacity_select"));
  $("#lang").attr('title', i18next.t("lang_select"));
  $("#layer_street_lights").html(i18next.t("layer_street_lights"));
  $("#layer_aviation_lights").html(i18next.t("layer_aviation"));
  $("#layer_lit_streets").html(i18next.t("layer_lit_streets"));
  $("#layer_unlit_streets").html(i18next.t("layer_unlit_streets"));
  console.log("ContentUpdated");
}

function updateLng() {
  lng = $("#langselect").val()
  i18next.changeLanguage(lng);
}

i18next.on('languageChanged', () => {
  console.log("Language changed");
  if(!i18next.isInitialized) {
    // wait for initalization
    i18next.on('initialized', updateContent);
  }
  else{
	updateContent();
  }
});
