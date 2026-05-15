/** Monument detail cards — merged into strings.hy / ru / en */

const UI = {
  hy: {
    cardSectionFacts: 'Կարճ',
    cardSectionWhy: 'Ինչու այստեղ',
    cardSectionStory: 'Պատմություն',
    cardSectionPerson: 'Ով է հիշատակվել',
    cardFactLabelUnveiled: 'Տեղադրվել է',
    cardFactLabelAuthor: 'Հեղինակ',
    cardFactLabelCommissioned: 'Պատվիրել է',
    cardFactLabelScale: 'Մասշտաբ',
    cardFactLabelLife: 'Կյանք',
    cardFactLabelPlace: 'Վայր',
    cardFactLabelType: 'Տեսակ',
    cardTier1Lead: 'Քաղաքային կետ առանց պարզ անվան',
    cardTier1Why:
      'Կատալոգում նշված է ընդհանուր անունով․ սա կարող է լինել փոքր հուշարձան, բազմակի կամ ժամանակավոր տեղադրում։',
    cardTier1Story:
      '«{name}» — բացված կետ քարտեզում։ Մոտեցեք, նայեք շրջապատին․ երբեմն տեղում կա լրացուցիչ նշում։',
    cardTier2Lead: 'Անվանված հուշարձան Երևանում',
    cardTier2Why:
      'Նշված է քաղաքային քարտեզներում․ հաճախ սա տեղական հուշարձան, հուշատախտակ կամ քանդակ՝ կոնկրետ անունով։',
    cardTier2Story: '«{name}» — քաղաքի հանրային տարածքի մաս։',
    cardTier2StoryAddress: '«{name}» · {address}',
  },
  ru: {
    cardSectionFacts: 'Кратко',
    cardSectionWhy: 'Зачем здесь',
    cardSectionStory: 'История',
    cardSectionPerson: 'Кого памятуют',
    cardFactLabelUnveiled: 'Установлен',
    cardFactLabelAuthor: 'Автор',
    cardFactLabelCommissioned: 'Заказчик',
    cardFactLabelScale: 'Масштаб',
    cardFactLabelLife: 'Жизнь',
    cardFactLabelPlace: 'Место',
    cardFactLabelType: 'Тип',
    cardTier1Lead: 'Городская точка без точного имени',
    cardTier1Why:
      'В каталоге указано общее название — возможно, небольшой памятник, мемориал или временная установка.',
    cardTier1Story:
      '«{name}» — открытая точка на карте. Подойдите ближе: иногда на месте есть уточняющая табличка.',
    cardTier2Lead: 'Именной памятник Еревана',
    cardTier2Why:
      'Отмечен на городских картах: обычно это локальный памятник, мемориал или скульптура с конкретным названием.',
    cardTier2Story: '«{name}» — часть городского пространства.',
    cardTier2StoryAddress: '«{name}» · {address}',
  },
  en: {
    cardSectionFacts: 'At a glance',
    cardSectionWhy: 'Why here',
    cardSectionStory: 'Story',
    cardSectionPerson: 'Who is remembered',
    cardFactLabelUnveiled: 'Unveiled',
    cardFactLabelAuthor: 'Artist',
    cardFactLabelCommissioned: 'Commissioned by',
    cardFactLabelScale: 'Scale',
    cardFactLabelLife: 'Life',
    cardFactLabelPlace: 'Location',
    cardFactLabelType: 'Type',
    cardTier1Lead: 'City point without a precise name',
    cardTier1Why:
      'Listed under a generic title — may be a small marker, memorial, or temporary installation.',
    cardTier1Story:
      '“{name}” is unlocked on your map. Walk closer; a plaque on site may tell more.',
    cardTier2Lead: 'Named monument in Yerevan',
    cardTier2Why:
      'Marked on city maps — typically a local statue, memorial, or sculpture with a specific title.',
    cardTier2Story: '“{name}” — part of the city’s public space.',
    cardTier2StoryAddress: '“{name}” · {address}',
  },
};

const motherArmenia = {
  hy: {
    card_mother_armenia_lead:
      'Երևանի ամենաճանաչ խորհրդանիշներից մեկը՝ Արմենիայի հզորությունն ու հիշողությունը։',
    card_mother_armenia_why:
      'Կանգնած է Հաղթանակի պուրակի բարձրադաշտում՝ նայում է մայրաքաղաքին, մոտ է Հավերժական կրակին և հիշողության համալիրին․ այստեղ հիշում են Հայոց ցեղասպանության և Մեծ Հայրենականի զոհերին։',
    card_mother_armenia_story:
      '1967 թվականին բացվել է այժմյան պղնձե «Մայր Հայաստան» արձանը (22 մ)՝ փոխարինելով 1950 թվականի գրանիտային կոմպոզիցիան։ Հուշարձանը միավորում է հիշողության, պաշտպանության և հույսի պատկերը․ հաճախ այցելում են տոնականգներին, զինվորական երդման և հիշատակման արարողություններին։',
    card_mother_armenia_fact_author: 'Արա Հարությունյան (քանդակ)',
    card_mother_armenia_fact_commissioned:
      'Հայաստանի Խորհրդային Սոցիալիստական Հանրապետություն, պատերազմի հիշատակ',
    card_mother_armenia_fact_scale: '22 մ բարձրություն',
    card_mother_armenia_fact_unveiled: '1967',
  },
  ru: {
    card_mother_armenia_lead:
      'Один из главных символов Еревана — сила и память Армении.',
    card_mother_armenia_why:
      'Стоит на плато парка Победы с видом на город, рядом с Вечным огнём и мемориальным комплексом в память жертв Геноцида и Великой Отечественной войны.',
    card_mother_armenia_story:
      'В 1967 году открыта нынешняя бронзовая «Мать-Армения» (22 м), сменившая гранитную композицию 1950 года. Памятник объединяет образ памяти, защиты и надежды; сюда приходят на праздники, присягу и траурные церемонии.',
    card_mother_armenia_fact_author: 'Ара Арутюнян (скульптор)',
    card_mother_armenia_fact_commissioned:
      'Армянская ССР, мемориал войны и памяти',
    card_mother_armenia_fact_scale: 'Высота 22 м',
    card_mother_armenia_fact_unveiled: '1967',
  },
  en: {
    card_mother_armenia_lead:
      'One of Yerevan’s best-known symbols — Armenia’s strength and memory.',
    card_mother_armenia_why:
      'Stands on Victory Park plateau overlooking the city, beside the Eternal Flame and memorial complex for victims of the Genocide and WWII.',
    card_mother_armenia_story:
      'The current bronze Mother Armenia (22 m) was unveiled in 1967, replacing the 1950 granite composition. The monument unites memory, defense, and hope; people gather here for national holidays, military oath ceremonies, and remembrance.',
    card_mother_armenia_fact_author: 'Ara Harutyunyan (sculpture)',
    card_mother_armenia_fact_commissioned:
      'Soviet Armenian republic, war memorial program',
    card_mother_armenia_fact_scale: '22 m tall',
    card_mother_armenia_fact_unveiled: '1967',
  },
};

const sasuntsi = {
  hy: {
    card_sasuntsi_davit_lead: 'Ֆրանկ Հալեպի «Սասունցի Դավիթ» — քաղաքի սիրելի հերոսը։',
    card_sasuntsi_davit_why:
      'Կանգնած է Սասունցի Դավիթի հրապարակում՝ կենտրոնի հարավային մուտքի մոտ, որտեղ հաճախ հավաքվում են երեխաներ և հյուրեր։',
    card_sasuntsi_davit_story:
      '1960-ականներին տեղադրված քանդակը պատկերում է հեքիաչական հերոս Դավիթին՝ որպես ազատության և հպատակության խորհրդանիշ։ Երևանցիները հանդիպում են այստեղ, նկարներ են անում, հիշում են հեքիաչական ավանդույթը։',
    card_sasuntsi_davit_fact_author: 'Ֆրանկ Հալեպ',
    card_sasuntsi_davit_fact_commissioned: 'Երևանի քաղաքապետարան',
    card_sasuntsi_davit_fact_scale: 'Բրոնզե հուշարձան',
    card_sasuntsi_davit_fact_unveiled: '1959',
  },
  ru: {
    card_sasuntsi_davit_lead: '«Сасунци Давид» Фрэнка Мура — любимый герой города.',
    card_sasuntsi_davit_why:
      'На площади Сасунци Давид у южного подъезда в центр — популярное место встреч и прогулок.',
    card_sasuntsi_davit_story:
      'Скульптура эпического героя Давида — символ свободы и стойкости. Памятник стал частью городского фольклора: здесь фотографируются и вспоминают армянское эпосное наследие.',
    card_sasuntsi_davit_fact_author: 'Фрэнк Мур (Франк Халап)',
    card_sasuntsi_davit_fact_commissioned: 'Администрация Еревана',
    card_sasuntsi_davit_fact_scale: 'Бронзовая скульптура',
    card_sasuntsi_davit_fact_unveiled: '1959',
  },
  en: {
    card_sasuntsi_davit_lead: 'Frank Mur’s Sasuntsi Davit — a beloved city hero.',
    card_sasuntsi_davit_why:
      'On Sasuntsi Davit Square near the south entrance to downtown — a classic meeting spot.',
    card_sasuntsi_davit_story:
      'The bronze epic hero symbolizes freedom and resilience. Locals meet and photograph the statue, linking the square to Armenia’s epic tradition.',
    card_sasuntsi_davit_fact_author: 'Frank Mur (Halap)',
    card_sasuntsi_davit_fact_commissioned: 'Yerevan city authorities',
    card_sasuntsi_davit_fact_scale: 'Bronze monument',
    card_sasuntsi_davit_fact_unveiled: '1959',
  },
};

const tsitsernakaberd = {
  hy: {
    card_tsitsernakaberd_lead: 'Հայոց ցեղասպանության հիշատակման գլխավոր մարդկային հուշարձանը։',
    card_tsitsernakaberd_why:
      'Ծիծեռնակաբերդի բլրի վրա՝ ցեղասպանության զոհերի հիշատակին նվիրված 12 հեկտարանոց պուրակում, որտեղ ամեն տարի ապրիլի 24-ին հավաքվում են հազարավոր մարդիկ։',
    card_tsitsernakaberd_story:
      'Հուշահամալիրը ներառում է 44-մետրանոց ստելա, թանգարան և հուշարձաններ․ կառուցվել է 1967 թվականին՝ հիշելու 1915 թվականի ողբերգությունը և պահպանելու հիշողությունը սերունդների համար։',
    card_tsitsernakaberd_fact_author: 'Հուշահամալիրի ճարտարապետներ',
    card_tsitsernakaberd_fact_commissioned: 'Խորհրդային Հայաստան, հիշողության պետական ծրագիր',
    card_tsitsernakaberd_fact_scale: '44 մ ստելա',
    card_tsitsernakaberd_fact_unveiled: '1967',
  },
  ru: {
    card_tsitsernakaberd_lead: 'Главный мемориал памяти Геноцида армян.',
    card_tsitsernakaberd_why:
      'На холме Цицернакаберд в 12-гектарном парке памяти; 24 апреля сюда приходят тысячи людей.',
    card_tsitsernakaberd_story:
      'Комплекс включает 44-метровую стелу, музей и монументы; открыт в 1967 году, чтобы сохранить память о трагедии 1915 года для будущих поколений.',
    card_tsitsernakaberd_fact_author: 'Архитекторы мемориала',
    card_tsitsernakaberd_fact_commissioned: 'Советская Армения, государственная программа памяти',
    card_tsitsernakaberd_fact_scale: 'Стела 44 м',
    card_tsitsernakaberd_fact_unveiled: '1967',
  },
  en: {
    card_tsitsernakaberd_lead: 'Armenia’s central memorial to the Genocide.',
    card_tsitsernakaberd_why:
      'On Tsitsernakaberd hill in a 12-hectare remembrance park; thousands gather each April 24.',
    card_tsitsernakaberd_story:
      'The complex includes a 44 m stele, museum, and monuments; opened in 1967 to preserve memory of the 1915 tragedy for future generations.',
    card_tsitsernakaberd_fact_author: 'Memorial architects',
    card_tsitsernakaberd_fact_commissioned: 'Soviet Armenia, state remembrance program',
    card_tsitsernakaberd_fact_scale: '44 m stele',
    card_tsitsernakaberd_fact_unveiled: '1967',
  },
};

const republic = {
  hy: {
    card_republic_square_lead: 'Երևանի սրտը՝ Հանրապետության հրապարակը։',
    card_republic_square_why:
      'Քաղաքի գլխավոր հրապարակն է՝ կառուցապատված 1920-ականներից, շրջապատված կառավարական շենքերով, շատրվանով և ցնցուղային արձաններով։',
    card_republic_square_story:
      'Հրապարակը հավաքում է տոնականգները, համերգները և հանրային արարողությունները․ արձանները և ցնցուղները դարձել են քաղաքի տեսարանային կենտրոնը։',
    card_republic_square_fact_author: 'Տարբեր հեղինակներ (XX դար)',
    card_republic_square_fact_commissioned: 'Երևանի քաղաքային կառուցապատում',
    card_republic_square_fact_scale: 'Գլխավոր հրապարակ',
    card_republic_square_fact_unveiled: 'XX դար',
  },
  ru: {
    card_republic_square_lead: 'Сердце Еревана — площадь Республики.',
    card_republic_square_why:
      'Главная площадь с 1920-х годов: правительственные здания, фонтаны и скульптуры вокруг.',
    card_republic_square_story:
      'Здесь проходят праздники, концерты и народные события; ансамбль площади стал визитной карточкой города.',
    card_republic_square_fact_author: 'Разные авторы (XX век)',
    card_republic_square_fact_commissioned: 'Градостроительство Еревана',
    card_republic_square_fact_scale: 'Главная площадь',
    card_republic_square_fact_unveiled: 'XX век',
  },
  en: {
    card_republic_square_lead: 'The heart of Yerevan — Republic Square.',
    card_republic_square_why:
      'The main square since the 1920s, framed by government buildings, fountains, and sculptures.',
    card_republic_square_story:
      'Hosts holidays, concerts, and public events; the square’s ensemble is the city’s iconic center.',
    card_republic_square_fact_author: 'Various artists (20th c.)',
    card_republic_square_fact_commissioned: 'Yerevan urban planning',
    card_republic_square_fact_scale: 'Main square',
    card_republic_square_fact_unveiled: '20th century',
  },
};

const revived = {
  hy: {
    card_revived_armenia_lead: 'Ժամանակակից քանդակ՝ նոր Հայաստանի մասին։',
    card_revived_armenia_why:
      'Կասկադի մոտակայքում՝ տեսանելի վայր քաղաքացիների և զբոսաշրջիչների համար։',
    card_revived_armenia_story:
      '«Վերածնված Հայաստան» արձանը խորհրդանշում է կյանքի շարունակությունը և կառուցողականությունը անկախության շրջանում։',
    card_revived_armenia_fact_author: 'Ժամանակակից հեղինակ',
    card_revived_armenia_fact_commissioned: 'Հանրային արվեստի ծրագիր',
    card_revived_armenia_fact_scale: 'Քաղաքային քանդակ',
    card_revived_armenia_fact_unveiled: '2010',
  },
  ru: {
    card_revived_armenia_lead: 'Современная скульптура о новой Армении.',
    card_revived_armenia_why: 'Рядом с Каскадом — заметное место для прогулок.',
    card_revived_armenia_story:
      '«Возрождённая Армения» символизирует продолжение жизни и созидание в эпоху независимости.',
    card_revived_armenia_fact_author: 'Современный автор',
    card_revived_armenia_fact_commissioned: 'Городская скульптура',
    card_revived_armenia_fact_scale: 'Городская скульптура',
    card_revived_armenia_fact_unveiled: '2010',
  },
  en: {
    card_revived_armenia_lead: 'A contemporary symbol of a new Armenia.',
    card_revived_armenia_why: 'Near the Cascade — visible to walkers and visitors.',
    card_revived_armenia_story:
      '“Revived Armenia” expresses continuity and building in the independence era.',
    card_revived_armenia_fact_author: 'Contemporary artist',
    card_revived_armenia_fact_commissioned: 'Public art program',
    card_revived_armenia_fact_scale: 'Urban sculpture',
    card_revived_armenia_fact_unveiled: '2010',
  },
};

const curatedCards = {
  hy: {
    card_abovyan_lead: 'Խաչատուր Աբովյան — լուսավորիչ գրող, դպրոցի և գրականության հիմնադիր։',
    card_abovyan_why:
      'Փողոցի սկիզբում, որը կրում է նրա անունը․ կապված է դպրոցական և մշակութային ավանդույթի հետ։',
    card_abovyan_story:
      'Հուշարձանը հիշեցնում է, որ նոր հայ գրականությունը սկսվել է մանկական կրթությունից և հասարակական խոսքից։',
    card_abovyan_fact_author: 'Քանդակագործական անհատականություն',
    card_abovyan_fact_commissioned: 'Երևանի հանրություն',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Կոմիտաս — հայ երաժշտության հիմնադիր և հավաքող։',
    card_komitas_why: 'Օպերայի թատրոնի հրապարակում՝ մշակութային կենտրոնում։',
    card_komitas_story:
      'Հուշարձանը պահպանում է հիշողությունը մեծ երաժշտագետի մասին, ով փրկեց հազարավոր ժողովրդական երգեր։',
    card_komitas_fact_author: 'Քանդակագործ',
    card_komitas_fact_commissioned: 'Խորհրդային Հայաստան',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1969',
    card_tumanyan_lead: 'Հովհաննես Թումանյան — «ողջ ժողովրդի բանաստեղծ»։',
    card_tumanyan_why: 'Կարապի լճի մոտ՝ սիրելի զբոսայգի։',
    card_tumanyan_story:
      'Քանդակը հիշեցնում է բանաստեղոծի դերը հայ մշակույթում և Երևանի գրական կյանքում։',
    card_tumanyan_fact_author: 'Քանդակագործ',
    card_tumanyan_fact_commissioned: 'Հանրային նախաձեռնություն',
    card_tumanyan_fact_life: '1869–1923',
    card_sayat_nova_lead: 'Սայաթ-Նովա — աշուղ և բանաստեղծ։',
    card_sayat_nova_why: 'Շատրվանի և համերգային տարածքի մոտ։',
    card_sayat_nova_story:
      'Հուշարձանը կապում է հրապարակի երաժշտական կյանքը 18-րդ դարի աշուղական ավանդույթի հետ։',
    card_sayat_nova_fact_author: 'Քանդակագործ',
    card_sayat_nova_fact_commissioned: 'Երևանի քաղաքապետարան',
    card_sayat_nova_fact_life: '1712–1795',
    card_charents_lead: 'Եղիշե Չարենց — XX դարի վաղ բանաստեղծ։',
    card_charents_why: 'Մաշտոցի պողոտայի գրական միջավայրում։',
    card_charents_story:
      'Հուշարձանը պահպանում է խոսքը այն բանաստեղծի մասին, ով միավորեց մոդեռնիզմն ու քաղաքացիականությունը։',
    card_charents_fact_author: 'Քանդակագործ',
    card_charents_fact_commissioned: 'Հանրային հիշատակ',
    card_charents_fact_life: '1897–1937',
  },
  ru: {
    card_abovyan_lead: 'Хачатур Абовян — писатель-просветитель, основатель школы и литературы.',
    card_abovyan_why: 'У начала одноимённой улицы, связанной со школьной традицией.',
    card_abovyan_story:
      'Памятник напоминает, что новая армянская литература началась с образования и гражданского слова.',
    card_abovyan_fact_author: 'Скульптор',
    card_abovyan_fact_commissioned: 'Общество Еревана',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Комитас — основатель армянской музыки и собиратель песен.',
    card_komitas_why: 'У площади оперного театра — в культурном центре.',
    card_komitas_story:
      'Памятник хранит память о музыканте, спасшем тысячи народных мелодий.',
    card_komitas_fact_author: 'Скульптор',
    card_komitas_fact_commissioned: 'Советская Армения',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1969',
    card_tumanyan_lead: 'Ованес Туманян — «всенародный поэт».',
    card_tumanyan_why: 'У озера Кареп — любимый парк.',
    card_tumanyan_story:
      'Скульптура о роли поэта в армянской культуре и литературной жизни Еревана.',
    card_tumanyan_fact_author: 'Скульптор',
    card_tumanyan_fact_commissioned: 'Общественная инициатива',
    card_tumanyan_fact_life: '1869–1923',
    card_sayat_nova_lead: 'Саят-Нова — ашуг и поэт.',
    card_sayat_nova_why: 'У театрально-концертной зоны.',
    card_sayat_nova_story:
      'Памятник связывает музыкальную жизнь площади с ашугской традицией XVIII века.',
    card_sayat_nova_fact_author: 'Скульптор',
    card_sayat_nova_fact_commissioned: 'Город Ереван',
    card_sayat_nova_fact_life: '1712–1795',
    card_charents_lead: 'Егише Чаренц — поэт раннего XX века.',
    card_charents_why: 'На проспекте Маштоца — литературная среда.',
    card_charents_story:
      'Памятник о поэте, соединившем модернизм и гражданственность.',
    card_charents_fact_author: 'Скульптор',
    card_charents_fact_commissioned: 'Общественная память',
    card_charents_fact_life: '1897–1937',
  },
  en: {
    card_abovyan_lead: 'Khachatur Abovyan — educator-writer, founder of modern schooling and literature.',
    card_abovyan_why: 'At the start of the street named for him, tied to school tradition.',
    card_abovyan_story:
      'The monument recalls that modern Armenian literature grew from education and public speech.',
    card_abovyan_fact_author: 'Sculptor',
    card_abovyan_fact_commissioned: 'Civic Yerevan',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Komitas — founder of Armenian music and collector of songs.',
    card_komitas_why: 'By the opera house square — a cultural center.',
    card_komitas_story:
      'Honors the musician who preserved thousands of folk melodies.',
    card_komitas_fact_author: 'Sculptor',
    card_komitas_fact_commissioned: 'Soviet Armenia',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1969',
    card_tumanyan_lead: 'Hovhannes Tumanyan — the “all-people’s poet”.',
    card_tumanyan_why: 'By Swan Lake — a beloved park.',
    card_tumanyan_story:
      'The statue reflects the poet’s place in Armenian culture and Yerevan’s literary life.',
    card_tumanyan_fact_author: 'Sculptor',
    card_tumanyan_fact_commissioned: 'Public initiative',
    card_tumanyan_fact_life: '1869–1923',
    card_sayat_nova_lead: 'Sayat-Nova — ashug and poet.',
    card_sayat_nova_why: 'Near the theater and concert area.',
    card_sayat_nova_story:
      'Links the square’s musical life to the 18th-century ashug tradition.',
    card_sayat_nova_fact_author: 'Sculptor',
    card_sayat_nova_fact_commissioned: 'City of Yerevan',
    card_sayat_nova_fact_life: '1712–1795',
    card_charents_lead: 'Yeghishe Charents — poet of the early 20th century.',
    card_charents_why: 'On Mashtots Avenue — literary setting.',
    card_charents_story:
      'Remembers the poet who united modernism and civic voice.',
    card_charents_fact_author: 'Sculptor',
    card_charents_fact_commissioned: 'Public remembrance',
    card_charents_fact_life: '1897–1937',
  },
};

function mergeLocales(...parts) {
  return {
    hy: Object.assign({}, UI.hy, motherArmenia.hy, sasuntsi.hy, tsitsernakaberd.hy, republic.hy, revived.hy, curatedCards.hy, ...parts.map((p) => p.hy)),
    ru: Object.assign({}, UI.ru, motherArmenia.ru, sasuntsi.ru, tsitsernakaberd.ru, republic.ru, revived.ru, curatedCards.ru, ...parts.map((p) => p.ru)),
    en: Object.assign({}, UI.en, motherArmenia.en, sasuntsi.en, tsitsernakaberd.en, republic.en, revived.en, curatedCards.en, ...parts.map((p) => p.en)),
  };
}

export const monumentCardStrings = mergeLocales();
