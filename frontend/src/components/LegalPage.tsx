import { Reveal } from "@/components/Reveal";
import { getLegalDocument } from "@/lib/api";

const FALLBACK: Record<string, { title: string; content: string }> = {
  kvkk: {
    title: "KVKK Aydınlatma",
    content:
      "Kılıç Coffee Roasters olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işleriz. Verileriniz sipariş, teslimat, müşteri desteği ve yasal yükümlülüklerin yerine getirilmesi amacıyla sınırlı olarak kullanılır.",
  },
  "cerez-politikasi": {
    title: "Çerez Politikası",
    content:
      "Sitemizde oturum yönetimi, sepet sürekliliği ve yasal zorunluluklar için gerekli çerezler kullanılır. İsteğe bağlı analitik/pazarlama çerezleri yalnızca açık rızanızla etkinleştirilir.",
  },
  "mesafeli-satis": {
    title: "Mesafeli Satış Sözleşmesi",
    content:
      "Bu sözleşme, 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde alıcı ile satıcı arasındaki hak ve yükümlülükleri düzenler. Ürün teslimatı onay sonrası kargo sürecine alınır.",
  },
  "on-bilgilendirme": {
    title: "Ön Bilgilendirme Formu",
    content:
      "Sipariş vermeden önce satıcı bilgileri, ürün temel nitelikleri, toplam bedel, ödeme ve teslimat koşulları ile cayma hakkına ilişkin bilgilendirme bu form ile sağlanır.",
  },
  "iptal-iade": {
    title: "İptal ve İade Koşulları",
    content:
      "Taze kavrulmuş kahve ürünlerinde, ambalajı açılmamış ve bozulmamış ürünler için yasal cayma hakkı koşulları geçerlidir. Bozulabilir nitelikteki açılmış ürünlerde iade kısıtlanabilir.",
  },
  "aydinlatma-metni": {
    title: "Aydınlatma Metni",
    content:
      "Kişisel verilerinizin toplanma yöntemi, hukuki sebepleri, aktarım amaçları ve haklarınız (erişim, düzeltme, silme, itiraz) bu aydınlatma metninde açıklanmıştır.",
  },
  gizlilik: {
    title: "Gizlilik Politikası",
    content:
      "Gizliliğiniz bizim için önceliklidir. Topladığımız bilgiler yalnızca hizmet sunumu ve yasal yükümlülükler için kullanılır; üçüncü taraflarla paylaşım sınırlı ve sözleşmesel temellidir.",
  },
};

type Props = {
  slug: string;
};

export async function LegalPage({ slug }: Props) {
  const doc = await getLegalDocument(slug);
  const fallback = FALLBACK[slug] ?? {
    title: slug,
    content: "Bu yasal metin yakında yayınlanacaktır.",
  };

  const title = doc?.title || fallback.title;
  const content = doc?.content || fallback.content;

  return (
    <article className="page-shell mx-auto max-w-3xl py-16 md:py-24">
      <div className="page-enter">
        <div className="mb-3 font-meta text-xs uppercase tracking-widest text-primary">
          Legal_Document / {slug}
        </div>
        <h1 className="font-display text-4xl leading-none md:text-5xl">{title}</h1>
        {doc?.version ? (
          <p className="mt-4 font-meta text-[11px] uppercase text-secondary">
            Sürüm {doc.version}
          </p>
        ) : null}
      </div>
      <Reveal className="mt-10" variant="scale" delay={120}>
        <div className="prose-legal whitespace-pre-wrap border border-outline-variant/20 bg-surface-container-low p-6 font-sans text-base leading-7 text-secondary md:p-10">
          {content}
        </div>
      </Reveal>
    </article>
  );
}
