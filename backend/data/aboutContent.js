export const aboutContent = {
  id: 'about-main',
  locale: 'tr-TR',
  status: 'published',
  updatedAt: '2026-08-24T10:00:00+03:00',
  hero: {
    eyebrow: 'TKMBS hakkında',
    title: "Hatay'ın tarihi ve kültürel mirası",
    emphasis: 'tek yerde.',
    description: "Tarihi eserleri, kültürel rotaları ve etkinlikleri doğru konum bilgileriyle keşfedin; Hatay'ın zengin mirasına tek noktadan ulaşın.",
    backgroundImage: '/assets/monuments/habib-neccar-main.jpg',
    actions: [
      { label: 'Haritayı keşfet', href: '/harita', variant: 'primary' },
      { label: 'Eserleri incele', href: '/tarihi-eserler', variant: 'secondary' },
    ],
  },
  summary: [
    { key: 'monuments', label: 'Kayıtlı eser', icon: 'monument' },
    { key: 'routes', label: 'Kültürel rota', icon: 'route' },
    { key: 'events', label: 'Etkinlik', icon: 'calendar' },
    { key: 'locations', label: 'Harita konumu', icon: 'pin' },
  ],
  introduction: {
    eyebrow: 'PROJE HAKKINDA',
    title: 'Hatay’ı tanımak ve daha güzel gezmek için',
    paragraphs: [
      'Tarihi ve Kültürel Miras Bilgi Sistemi, Hatay’ın binlerce yıllık geçmişini vatandaşlarımız ve ziyaretçilerimiz için daha kolay anlaşılır ve erişilebilir hale getirmek amacıyla hazırlanmıştır.',
      'Ziyaret etmek istediğiniz yer hakkında önceden bilgi edinebilir, konumunu haritada görebilir, size uygun kültürel rotayı seçebilir ve gezi gününüzü daha verimli planlayabilirsiniz.',
    ],
  },
  capabilities: {
    eyebrow: 'NASIL YARARLANABİLİRSİNİZ?',
    title: 'Keşfedin, öğrenin ve gezinizi planlayın',
    items: [
      { icon: 'monument', title: 'Tarihi yerleri tanıyın', text: 'Hatay’ın camilerini, kiliselerini, müzelerini, kalelerini ve doğal güzelliklerini yakından tanıyın.' },
      { icon: 'map', title: 'Haritada kolayca bulun', text: 'Ziyaret etmek istediğiniz yerlerin konumunu görün ve çevrenizdeki kültürel durakları keşfedin.' },
      { icon: 'route', title: 'Gezinizi planlayın', text: 'Hazırlanan kültürel rotalarla gezi sürenizi, duraklarınızı ve ziyaret sıranızı önceden planlayın.' },
      { icon: 'calendar', title: 'Etkinliklere katılın', text: 'Kültür, sanat, gezi ve atölye programlarını takvimden izleyerek Hatay’ın kültürel yaşamına katılın.' },
    ],
  },
  guide: {
    eyebrow: 'HATAY’I KEŞFETME REHBERİ',
    title: 'Geziye başlamadan önce ihtiyacınız olan bilgiler',
    description: 'Gitmek istediğiniz yeri seçin, tarihini ve ziyaret bilgilerini okuyun. Haritadaki konumunu inceleyin, yakınındaki diğer eserleri görün ve zamanınıza uygun bir rota oluşturarak Hatay’ı kendi hızınızda keşfedin.',
    noteTitle: 'Hatay Büyükşehir Belediyesi',
    noteText: 'Kentimizin tarihi ve kültürel değerlerini tanıtmak, kültür turizmini desteklemek ve vatandaşlarımızın doğru bilgiye kolayca ulaşmasını sağlamak için çalışıyoruz.',
    steps: [
      { number: '01', title: 'Keşfet', text: 'İlginizi çeken tarihi eserleri, doğal alanları ve kültürel etkinlikleri bulun.' },
      { number: '02', title: 'Bilgi edin', text: 'Ziyaret öncesinde yapının tarihini, özelliklerini, konumunu ve ziyaret bilgilerini öğrenin.' },
      { number: '03', title: 'Planla', text: 'Kültürel rotaları inceleyin veya görmek istediğiniz duraklarla kendi gezi planınızı hazırlayın.' },
      { number: '04', title: 'Hatay’ı yaşa', text: 'Hazırladığınız planla şehri gezin, kültürel mirası yerinde görün ve deneyimleyin.' },
    ],
  },
  municipality: {
    eyebrow: 'BELEDİYEMİZİN AMACI',
    title: 'Kültürel mirası herkes için görünür kılmak',
    description: 'Hatay’ın eşsiz tarihini korurken bu değerlerin vatandaşlarımız, çocuklarımız ve kentimizi ziyaret eden misafirlerimiz tarafından daha iyi tanınmasını amaçlıyoruz.',
    goals: [
      { title: 'Kolay erişim', text: 'Kültürel bilgilere herkesin rahatça ulaşabilmesi' },
      { title: 'Doğru yönlendirme', text: 'Ziyaretçilerin gezi öncesinde ihtiyaç duyduğu bilgileri bulabilmesi' },
      { title: 'Kültürel farkındalık', text: 'Hatay’ın zengin mirasının daha yakından tanınması' },
      { title: 'Geleceğe aktarım', text: 'Tarihi ve kültürel değerlerin yeni kuşaklara anlatılması' },
    ],
  },
  closing: {
    eyebrow: "HATAY'I KEŞFET",
    title: 'Tarihimizi korumak,',
    secondLine: 'geleceğimize aktarmak.',
    action: { label: 'Kültürel rotalara göz at', href: '/kultur-rotalari' },
  },
};

export function getAboutContent() {
  return JSON.parse(JSON.stringify(aboutContent));
}
