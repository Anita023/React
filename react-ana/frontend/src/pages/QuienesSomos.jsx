import Header from "../components/Header";
import Footer from "../components/Footer";

function QuienesSomos() {
  return (
    <div>
      <Header />

      <main className="bg-cream">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 pb-14 pt-20 text-center sm:px-10">
          <span className="rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
            CONÓCENOS
          </span>
          <h1 className="text-4xl font-semibold">¿Quiénes somos?</h1>
          <p className="text-lg leading-relaxed text-choco-soft">
            Somos Sweet Ice, una heladería dedicada a crear momentos
            especiales a través de deliciosos helados artesanales.
          </p>
        </section>

        <section className="bg-white px-6 py-16 sm:px-10">
          <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
            <h2 className="text-3xl font-semibold">Nuestra historia</h2>
            <p className="text-base leading-relaxed text-choco-soft">
              Sweet Ice nació con la idea de ofrecer helados deliciosos,
              preparados con ingredientes de calidad y un estilo artesanal.
            </p>
            <p className="text-base leading-relaxed text-choco-soft">
              Queremos que cada persona que visite nuestra heladería
              encuentre un sabor que pueda disfrutar y recordar.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-4xl gap-7 px-6 py-16 sm:grid-cols-2 sm:px-10">
          <article className="rounded-3xl border border-border-soft bg-cream-soft p-9">
            <h2 className="relative mb-3 inline-block text-2xl font-semibold after:mt-2.5 after:block after:h-1 after:w-11 after:rounded-full after:bg-strawberry">
              Nuestra misión
            </h2>
            <p className="text-[15.5px] leading-relaxed text-choco-soft">
              Ofrecer helados artesanales de excelente calidad, brindando
              una experiencia agradable y un servicio cercano a nuestros
              clientes.
            </p>
          </article>

          <article className="rounded-3xl border border-border-soft bg-cream-soft p-9">
            <h2 className="relative mb-3 inline-block text-2xl font-semibold after:mt-2.5 after:block after:h-1 after:w-11 after:rounded-full after:bg-pistachio-deep">
              Nuestra visión
            </h2>
            <p className="text-[15.5px] leading-relaxed text-choco-soft">
              Ser una heladería reconocida por la calidad de nuestros
              productos, nuestra atención y la satisfacción de nuestros
              clientes.
            </p>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default QuienesSomos;
