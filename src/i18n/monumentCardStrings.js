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
    card_tsitsernakaberd_fact_author: 'Արթուր Թարխանյան, Սաշուր Քալաշյան',
    card_tsitsernakaberd_fact_commissioned:
      'Խորհրդային Հայաստանի պետություն, մրցույթ 1965 թ.',
    card_tsitsernakaberd_fact_scale: '44 մ ստելա',
    card_tsitsernakaberd_fact_unveiled: '1967',
  },
  ru: {
    card_tsitsernakaberd_lead: 'Главный мемориал памяти Геноцида армян.',
    card_tsitsernakaberd_why:
      'На холме Цицернакаберд в 12-гектарном парке памяти; 24 апреля сюда приходят тысячи людей.',
    card_tsitsernakaberd_story:
      'Комплекс включает 44-метровую стелу, музей и монументы; открыт в 1967 году, чтобы сохранить память о трагедии 1915 года для будущих поколений.',
    card_tsitsernakaberd_fact_author: 'Артур Тарханян, Сашур Калашян',
    card_tsitsernakaberd_fact_commissioned:
      'Государство Армянской ССР, конкурс 1965 г.',
    card_tsitsernakaberd_fact_scale: 'Стела 44 м',
    card_tsitsernakaberd_fact_unveiled: '1967',
  },
  en: {
    card_tsitsernakaberd_lead: 'Armenia’s central memorial to the Genocide.',
    card_tsitsernakaberd_why:
      'On Tsitsernakaberd hill in a 12-hectare remembrance park; thousands gather each April 24.',
    card_tsitsernakaberd_story:
      'The complex includes a 44 m stele, museum, and monuments; opened in 1967 to preserve memory of the 1915 tragedy for future generations.',
    card_tsitsernakaberd_fact_author: 'Arthur Tarkhanyan, Sashur Kalashyan',
    card_tsitsernakaberd_fact_commissioned:
      'Armenian SSR government, 1965 design competition',
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
      'Ալեքսանդր Թամանյանի գլխավոր գաղափարով 1926–1977 թթ. ձևավորված համալիրը ներառում է կառավարական շենքեր, Գեղարվեստի թանգարանը և երաժշտական շատրվաններ (վերականգնվել են 2007 թ.)․ այստեղ անցնում են տոնականգները և հանրային արարողությունները։',
    card_republic_square_fact_author: 'Ալեքսանդր Թամանյան և հետագա հեղինակներ',
    card_republic_square_fact_commissioned: 'Երևանի գլխավոր քաղաքապատման պլան',
    card_republic_square_fact_scale: '3 հա, 5 շենքերի համալիր',
    card_republic_square_fact_unveiled: '1977 (ամբողջական համալիր)',
  },
  ru: {
    card_republic_square_lead: 'Сердце Еревана — площадь Республики.',
    card_republic_square_why:
      'Главная площадь с 1920-х годов: правительственные здания, фонтаны и скульптуры вокруг.',
    card_republic_square_story:
      'Ансамбль по проекту Александра Таманяна (1926–1977) включает правительственные здания, галерею и музыкальные фонтаны (обновлены в 2007). Здесь проходят праздники и массовые события.',
    card_republic_square_fact_author: 'Александр Таманян и др.',
    card_republic_square_fact_commissioned: 'Генплан Еревана',
    card_republic_square_fact_scale: '3 га, ансамбль из 5 зданий',
    card_republic_square_fact_unveiled: '1977 (завершение ансамбля)',
  },
  en: {
    card_republic_square_lead: 'The heart of Yerevan — Republic Square.',
    card_republic_square_why:
      'The main square since the 1920s, framed by government buildings, fountains, and sculptures.',
    card_republic_square_story:
      'Alexander Tamanyan’s master plan (1926–1977) shaped the government buildings, museums, and musical fountains (renovated 2007). The square hosts national holidays and public gatherings.',
    card_republic_square_fact_author: 'Alexander Tamanyan et al.',
    card_republic_square_fact_commissioned: 'Yerevan master plan',
    card_republic_square_fact_scale: '3 ha, five-building ensemble',
    card_republic_square_fact_unveiled: '1977 (ensemble completed)',
  },
};

const revived = {
  hy: {
    card_revived_armenia_lead:
      '«Վերածնված Հայաստան» սյունը՝ 1967 թվականի հուշարձան, որից հետո կառուցվեց Կասկադը։',
    card_revived_armenia_why:
      'Կանակերի սարավերցում, Կասկադի վերին հարթակում․ տեսարան դեպի Արարատ և ամբողջ Երևան։',
    card_revived_armenia_story:
      '1967 թվականին բացվել է Սարգիս Գուրզադյանի և Ջիմ Թորոսյանի սյունը (~50 մ)՝ ավարտելով քաղաքի հյուսիս-հարավ առանցքը։ Դրանից հետո մտածեցին սանդուղքով կապել կենտրոնը հուշարձանի հետ․ Կասկադի կառուցումը սկսվեց 1970-ականներին։ 2009 թվականին բացվեց «Կաֆեսջյան» արվեստի կենտրոնը՝ արդեն որպես ամբողջ համալիրի մաս։',
    card_revived_armenia_fact_author: 'Սարգիս Գուրզադյան, Ջիմ Թորոսյան',
    card_revived_armenia_fact_commissioned:
      'Խորհրդային Հայաստան, քաղաքային հուշարձանային ծրագիր',
    card_revived_armenia_fact_scale: 'Սյուն ~50 մ (համալիր ~65 մ)',
    card_revived_armenia_fact_unveiled: '1967',
  },
  ru: {
    card_revived_armenia_lead:
      'Обелиск «Возрождённая Армения» — памятник 1967 года, после которого строили Каскад.',
    card_revived_armenia_why:
      'На плато Канакера, на вершине Каскада — панорама на Арарат и Ереван.',
    card_revived_armenia_story:
      'В 1967 г. открыт обелиск Гурзадяна и Торосяна (~50 м), завершивший главную ось города. Затем решили связать центр лестницей с монументом — строительство Каскада началось в 1970‑х. В 2009 г. открылся центр Кафесджян как часть уже готового комплекса, а не как дата открытия самого обелиска.',
    card_revived_armenia_fact_author: 'Саркис Гурзадян, Джим Торосян',
    card_revived_armenia_fact_commissioned:
      'Советская Армения, городская мемориальная программа',
    card_revived_armenia_fact_scale: 'Обелиск ~50 м (комплекс ~65 м)',
    card_revived_armenia_fact_unveiled: '1967',
  },
  en: {
    card_revived_armenia_lead:
      'The “Revived Armenia” obelisk — unveiled in 1967, before the Cascade was built below it.',
    card_revived_armenia_why:
      'On the Kanaker plateau at the top of the Cascade, with views of Ararat and Yerevan.',
    card_revived_armenia_story:
      'The obelisk by Sargis Gurzadyan and Jim Torosyan was unveiled in 1967 (~50 m), completing the city’s main north–south axis. The idea of a stairway to the monument led to the Cascade (construction from the 1970s). The Cafesjian Center opened in 2009 as part of the restored complex — not the obelisk’s unveiling date.',
    card_revived_armenia_fact_author: 'Sargis Gurzadyan, Jim Torosyan',
    card_revived_armenia_fact_commissioned:
      'Soviet Armenia, urban memorial program',
    card_revived_armenia_fact_scale: 'Obelisk ~50 m (ensemble ~65 m)',
    card_revived_armenia_fact_unveiled: '1967',
  },
};

const ironFountain = {
  hy: {
    card_iron_fountain_lead:
      'Գյումրիի «Երկաթե շատրվանը» — սովետական մոդեռնի խորհրդանիշ և քաղաքի կենսունակության պատկեր։',
    card_iron_fountain_why:
      'Գյումրիի կենտրոնից դուրս, Շիրակի մարզում․ հայտնի է որպես «ՈՒՕ-շատրվան» և «Ընկերության շատրվան»։',
    card_iron_fountain_story:
      '1982 թվականին Արթուր Թարխանյանի նախագծով կառուցված մետաղական կառույցը հիշեցնում է թիթեռի թևեր բացող տիեզերական նավ․ 1988 թվականի երկրաշարժից հետո շատրվանը դադարեց աշխատել, բայց կանգնեց և դարձավ քաղաքի հիշողության կետ։',
    card_iron_fountain_fact_author: 'Արթուր Թարխանյան',
    card_iron_fountain_fact_commissioned: 'Գյումրիի քաղաքային ծրագիր',
    card_iron_fountain_fact_scale: 'Մետաղ և բետոն, ~14 մ',
    card_iron_fountain_fact_unveiled: '1982',
  },
  ru: {
    card_iron_fountain_lead:
      '«Железный фонтан» в Гюмри — символ советского модерна и стойкости города.',
    card_iron_fountain_why:
      'На окраине Гюмри, Ширакская область; известен как «НЛО-фонтан» и «Фонтан дружбы».',
    card_iron_fountain_story:
      'Металлический фонтан по проекту Артура Тарханяна (1982) напоминает космический корабль с раскрывающимися «крыльями». После землетрясения 1988 г. перестал работать, но устоял и стал местом памяти и гордости жителей.',
    card_iron_fountain_fact_author: 'Артур Тарханян',
    card_iron_fountain_fact_commissioned: 'Градостроительная программа Гюмри',
    card_iron_fountain_fact_scale: 'Металл и бетон, ~14 м',
    card_iron_fountain_fact_unveiled: '1982',
  },
  en: {
    card_iron_fountain_lead:
      'Gyumri’s Iron Fountain — a Soviet modernist icon and symbol of endurance.',
    card_iron_fountain_why:
      'On the edge of Gyumri, Shirak Province; nicknamed the “UFO” or Friendship Fountain.',
    card_iron_fountain_story:
      'Built in 1982 to Artur Tarkhanyan’s design, the metal structure unfolds like butterfly wings around a “spaceship.” It stopped working after the 1988 earthquake but survived and became a beloved memorial landmark.',
    card_iron_fountain_fact_author: 'Artur Tarkhanyan',
    card_iron_fountain_fact_commissioned: 'Gyumri urban development program',
    card_iron_fountain_fact_scale: 'Metal & concrete, ~14 m',
    card_iron_fountain_fact_unveiled: '1982',
  },
};

const vardanMamikonyan = {
  hy: {
    card_vardan_mamikonyan_lead:
      'Վարդան Մամիկոնյանի հեծյալ արձանը՝ V դարի մարտն Ավարայրի ճակատամարտի հերոսի պատիվ։',
    card_vardan_mamikonyan_why:
      'Կլորայնի պուրակում, Վարդանանց փողոցի մոտ՝ քաղաքի կենտրոնական զբոսայգում։',
    card_vardan_mamikonyan_story:
      '1975 թվականին բացվել է Երվանդ Քոչարի և Ստեփան Քյուրկչյանի ստեղծած հուշարձանը․ բրոնզե հեծյալ արձանը (~17 մ) պատկերում է Մամիկոնյանին հարձակման պահին։ Հուշարձանը հիշեցնում է 451 թ. Ավարայրի ճակատամարտը և հայ հոգևոր ազատագրության պայքարը։',
    card_vardan_mamikonyan_fact_author: 'Երվանդ Քոչար (քանդակ), Ստեփան Քյուրկչյան',
    card_vardan_mamikonyan_fact_commissioned: 'Խորհրդային Հայաստանի պետություն',
    card_vardan_mamikonyan_fact_scale: 'Բրոնզ և ավազակար, ~17 մ',
    card_vardan_mamikonyan_fact_unveiled: '1975',
  },
  ru: {
    card_vardan_mamikonyan_lead:
      'Конный памятник Вардану Мамиконяну — герою битвы при Аварайре (451).',
    card_vardan_mamikonyan_why:
      'В Кольцевом парке у ул. Вардананц — в центральной городской зоне отдыха.',
    card_vardan_mamikonyan_story:
      'Открыт в 1975 г., скульптор Ерванд Кочар, архитектор Степан Кюркчян. Бронзовый всадник (~17 м) изображает полководца в момент атаки. Памятник напоминает о битве при Аварайре и борьбе за духовную свободу Армении.',
    card_vardan_mamikonyan_fact_author: 'Ерванд Кочар, Степан Кюркчян',
    card_vardan_mamikonyan_fact_commissioned: 'Советская Армения',
    card_vardan_mamikonyan_fact_scale: 'Бронза и песчаник, ~17 м',
    card_vardan_mamikonyan_fact_unveiled: '1975',
  },
  en: {
    card_vardan_mamikonyan_lead:
      'Equestrian monument to Vardan Mamikonyan — hero of the 451 Battle of Avarayr.',
    card_vardan_mamikonyan_why:
      'In Circular Park near Vardanants Street — a central green space in Yerevan.',
    card_vardan_mamikonyan_story:
      'Unveiled in 1975, sculpted by Yervand Kochar with architect Stepan Kyurkchyan. The ~17 m bronze rider shows Mamikonyan charging into battle, honoring the 451 Battle of Avarayr and Armenia’s fight for spiritual freedom.',
    card_vardan_mamikonyan_fact_author: 'Yervand Kochar, Stepan Kyurkchyan',
    card_vardan_mamikonyan_fact_commissioned: 'Soviet Armenian republic',
    card_vardan_mamikonyan_fact_scale: 'Bronze & sandstone, ~17 m',
    card_vardan_mamikonyan_fact_unveiled: '1975',
  },
};

const curatedCards = {
  hy: {
    card_abovyan_lead: 'Խաչատուր Աբովյան — լուսավորիչ գրող, դպրոցի և գրականության հիմնադիր։',
    card_abovyan_why:
      'Աբովյան այգում, Աբովյան փողոցի սկզբում․ կենտրոնական հանրային այգի և հիշատակման վայր։',
    card_abovyan_story:
      '1950 թվականին Սուրեն Ստեփանյանի և Գևորգ Թամանյանի ստեղծած բրոնզե-գրանիտ հուշարձանը (9 մ) հիշեցնում է «Վերք Հայաստանի» վեպի և հայերեն դասական դպրոցական բարեփոխման հեղինակին։',
    card_abovyan_fact_author: 'Սուրեն Ստեփանյան, Գևորգ Թամանյան',
    card_abovyan_fact_commissioned: 'Երևանի քաղաքապետարան',
    card_abovyan_fact_unveiled: '1950',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Կոմիտաս — հայ երաժշտության հիմնադիր և ժողովրդական երգերի հավաքող։',
    card_komitas_why:
      'Կոնսերվատորիայի և օպերայի թատրոնի մոտ՝ Ազատության հրապարակի մշակութային գոտում։',
    card_komitas_story:
      '1988 թվականին բացված Արա Հարությունյանի բրոնզե հուշարձանը պատկերում է Կոմիտասին կանգնած կիսաբաց ծիրանենու տակ՝ մտորենք ցավի և հիշողության մեջ։ Հարգանք է երաժշտագետին, ով փրկեց հազարավոր հայկական մեղեդիներ։',
    card_komitas_fact_author: 'Արա Հարությունյան, Ֆենիկս Դարբինյան',
    card_komitas_fact_commissioned: 'Խորհրդային Հայաստանի մշակույթի նախարարություն',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1988',
    card_tumanyan_lead: 'Հովհաննես Թումանյան — «ողջ ժողովրդի բանաստեղծ»։',
    card_tumanyan_why:
      'Ազատության հրապարակում, Կարապի լճի մոտ՝ օպերայի թատրոնի դիմաց։',
    card_tumanyan_story:
      '1957 թվականի նոյեմբերի 17-ին բացվել է Արա Սարգսյանի և Գրիգոր Աղաբաբյանի ստեղծած բրոնզե արձանը (8,55 մ)․ Թումանյանը նստած է գրքով ծունկերին։ «Անուշ» և հեքիաթները մինչև այսօր կարդացվում են այս հրապարակի մոտ։',
    card_tumanyan_fact_author: 'Արա Սարգսյան, Գրիգոր Աղաբաբյան',
    card_tumanyan_fact_commissioned: 'Երևանի գրական և հանրային միջոցառումներ',
    card_tumanyan_fact_life: '1869–1923',
    card_tumanyan_fact_unveiled: '1957',
    card_sayat_nova_lead: 'Սայաթ-Նովա — աշուղ, բանաստեղծ, բազմալեզու ստեղծագործ։',
    card_sayat_nova_why:
      'Մեսրոպ Մաշտոցի պող. 46, Սայաթ-Նովայի անվան երաժշտական դպրոցի դիմաց։',
    card_sayat_nova_story:
      '1963 թվականին Արա Հարությունյանի և Էդուարդ Սարապյանի հուշարձան-շատրվանը մարմարե պատի վրա կերտված է բանաստեղոծի դիմանկարը և նրա տողերը․ 1964 թվականին արվեստաբանը ստացել է ԽՍՀՄ Գեղարվեստի ակադեմիայի արծաթե մեդալ։',
    card_sayat_nova_fact_author: 'Արա Հարությունյան, Էդուարդ Սարապյան',
    card_sayat_nova_fact_commissioned: 'Երևանի քաղաքապետարան',
    card_sayat_nova_fact_life: '1712–1795',
    card_sayat_nova_fact_unveiled: '1963',
    card_charents_lead: 'Եղիշե Չարենց — XX դարի վաղ շրջանի մեծ բանաստեղծ։',
    card_charents_why:
      'Կլորայնի պուրակում՝ Սայաթ-Նովայի, Խանջյանի և Ալեք Մանուկյանի փողոցների խաչմերուկում։',
    card_charents_story:
      '1985 թվականի հոկտեմբերի 9-ին բացվել է Նիկողայոս Նիկողոսյանի և Ջիմ Թորոսյանի 18,5 մ բրոնզե համալիրը․ 40 աղբյուր՝ 40 կյանքի տարիներ, հավերժական կրակ և Չարենցի տողեր սյունակի վրա։',
    card_charents_fact_author: 'Նիկողայոս Նիկողոսյան, Ջիմ Թորոսյան',
    card_charents_fact_commissioned: 'Խորհրդային Հայաստանի մշակույթի նախարարություն',
    card_charents_fact_life: '1897–1937',
    card_charents_fact_unveiled: '1985',
  },
  ru: {
    card_abovyan_lead: 'Хачатур Абовян — писатель-просветитель, основатель школы и литературы.',
    card_abovyan_why: 'В парке Абовяна у начала одноимённой улицы — центральная зона отдыха.',
    card_abovyan_story:
      'Бронзово-гранитный памятник (9 м) Сурена Степаняна и Геворга Таманяна открыт в 1950 г. Чествует автора «Раны Армении» и реформатора армянского школьного образования.',
    card_abovyan_fact_author: 'Сурен Степанян, Геворг Таманян',
    card_abovyan_fact_commissioned: 'Ереванский горсовет',
    card_abovyan_fact_unveiled: '1950',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Комитас — основатель армянской музыки и собиратель песен.',
    card_komitas_why: 'У консерватории и оперного театра, на площади Свободы.',
    card_komitas_story:
      'Бронзовый памятник Ары Арутюняна (1988) изображает Комитаса под цветущим абрикосом. Память о музыканте, сохранившем тысячи армянских мелодий.',
    card_komitas_fact_author: 'Ара Арутюнян, Феникс Дарбинян',
    card_komitas_fact_commissioned: 'Министерство культуры Армянской ССР',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1988',
    card_tumanyan_lead: 'Ованес Туманян — «всенародный поэт».',
    card_tumanyan_why: 'На площади Свободы у Лебединого озера, напротив оперы.',
    card_tumanyan_story:
      '17 ноября 1957 г. открыта бронзовая скульптура Ары Саргсяна (8,55 м): поэт сидит с книгой на коленях. «Ануш» и сказки до сих пор читают у этого места.',
    card_tumanyan_fact_author: 'Ара Саргсян, Григор Агабабян',
    card_tumanyan_fact_commissioned: 'Ереванские литературные и общественные органы',
    card_tumanyan_fact_life: '1869–1923',
    card_tumanyan_fact_unveiled: '1957',
    card_sayat_nova_lead: 'Саят-Нова — ашуг, поэт, автор на нескольких языках.',
    card_sayat_nova_why: 'пр. Маштоца, 46, у музыкальной школы имени Саят-Новы.',
    card_sayat_nova_story:
      'Мемориальный фонтан Ары Арутюняна и Эдуарда Сарапяна (1963) с барельефом и строками поэта; в 1964 г. скульптор получил серебряную медаль Академии художеств СССР.',
    card_sayat_nova_fact_author: 'Ара Арутюнян, Эдуард Сарапян',
    card_sayat_nova_fact_commissioned: 'Город Ереван',
    card_sayat_nova_fact_life: '1712–1795',
    card_sayat_nova_fact_unveiled: '1963',
    card_charents_lead: 'Егише Чаренц — крупный поэт раннего XX века.',
    card_charents_why:
      'В Кольцевом парке на перекрёстке пр. Саят-Новы, ул. Ханджяна и А. Манукяна.',
    card_charents_story:
      '9 октября 1985 г. открыт бронзовый ансамбль Никогайоса Никогайосяна и Джима Торосяна (18,5 м): 40 источников — 40 лет жизни, вечный огонь и строки Чаренца на колонне.',
    card_charents_fact_author: 'Никогайос Никогайосян, Джим Торосян',
    card_charents_fact_commissioned: 'Министерство культуры Армянской ССР',
    card_charents_fact_life: '1897–1937',
    card_charents_fact_unveiled: '1985',
  },
  en: {
    card_abovyan_lead: 'Khachatur Abovyan — educator-writer, founder of modern schooling and literature.',
    card_abovyan_why: 'In Abovyan Park at the start of his namesake street — a central public garden.',
    card_abovyan_story:
      'The 9 m bronze-and-granite monument by Suren Stepanyan and Gevorg Tamanyan was unveiled in 1950, honoring the author of Wounds of Armenia and Armenian school reform.',
    card_abovyan_fact_author: 'Suren Stepanyan, Gevorg Tamanyan',
    card_abovyan_fact_commissioned: 'Yerevan city council',
    card_abovyan_fact_unveiled: '1950',
    card_abovyan_fact_life: '1809–1848',
    card_komitas_lead: 'Komitas — founder of Armenian music and collector of folk songs.',
    card_komitas_why: 'By the conservatory and opera house on Freedom Square.',
    card_komitas_story:
      'Ara Harutyunyan’s 1988 bronze shows Komitas beneath a blossoming apricot tree in contemplation. It honors the scholar who saved thousands of Armenian melodies.',
    card_komitas_fact_author: 'Ara Harutyunyan, Feniks Darbinyan',
    card_komitas_fact_commissioned: 'Armenian SSR Ministry of Culture',
    card_komitas_fact_life: '1869–1935',
    card_komitas_fact_unveiled: '1988',
    card_tumanyan_lead: 'Hovhannes Tumanyan — the “all-people’s poet”.',
    card_tumanyan_why: 'On Freedom Square by Swan Lake, facing the opera house.',
    card_tumanyan_story:
      'Unveiled 17 November 1957: Ara Sargsyan’s 8.55 m bronze shows the poet seated with a book. Anush and his fairy tales are still read near this square.',
    card_tumanyan_fact_author: 'Ara Sargsyan, Grigor Aghababyan',
    card_tumanyan_fact_commissioned: 'Yerevan literary and civic institutions',
    card_tumanyan_fact_life: '1869–1923',
    card_tumanyan_fact_unveiled: '1957',
    card_sayat_nova_lead: 'Sayat-Nova — ashug, poet, multilingual songwriter.',
    card_sayat_nova_why: '46 Mesrop Mashtots Ave., by Sayat-Nova Music School No. 2.',
    card_sayat_nova_story:
      'The 1963 memorial fountain by Ara Harutyunyan and Eduard Sarapyan features his portrait and verses in marble; Harutyunyan won a USSR Academy of Arts silver medal in 1964.',
    card_sayat_nova_fact_author: 'Ara Harutyunyan, Eduard Sarapyan',
    card_sayat_nova_fact_commissioned: 'City of Yerevan',
    card_sayat_nova_fact_life: '1712–1795',
    card_sayat_nova_fact_unveiled: '1963',
    card_charents_lead: 'Yeghishe Charents — major poet of the early 20th century.',
    card_charents_why:
      'Circular Park at Sayat-Nova Ave., Khanjyan St., and Alek Manukyan St.',
    card_charents_story:
      'Opened 9 October 1985: Nikoghayos Nikoghosyan and Jim Torosyan’s 18.5 m bronze ensemble with 40 springs for 40 years of life, an eternal flame, and Charents’s verse on the column.',
    card_charents_fact_author: 'Nikoghayos Nikoghosyan, Jim Torosyan',
    card_charents_fact_commissioned: 'Armenian SSR Ministry of Culture',
    card_charents_fact_life: '1897–1937',
    card_charents_fact_unveiled: '1985',
  },
};

function mergeLocales(...parts) {
  return {
    hy: Object.assign(
      {},
      UI.hy,
      motherArmenia.hy,
      sasuntsi.hy,
      tsitsernakaberd.hy,
      republic.hy,
      revived.hy,
      ironFountain.hy,
      vardanMamikonyan.hy,
      curatedCards.hy,
      ...parts.map((p) => p.hy)
    ),
    ru: Object.assign(
      {},
      UI.ru,
      motherArmenia.ru,
      sasuntsi.ru,
      tsitsernakaberd.ru,
      republic.ru,
      revived.ru,
      ironFountain.ru,
      vardanMamikonyan.ru,
      curatedCards.ru,
      ...parts.map((p) => p.ru)
    ),
    en: Object.assign(
      {},
      UI.en,
      motherArmenia.en,
      sasuntsi.en,
      tsitsernakaberd.en,
      republic.en,
      revived.en,
      ironFountain.en,
      vardanMamikonyan.en,
      curatedCards.en,
      ...parts.map((p) => p.en)
    ),
  };
}

export const monumentCardStrings = mergeLocales();
