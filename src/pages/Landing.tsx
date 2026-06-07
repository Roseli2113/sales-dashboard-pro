import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, BarChart3, Zap, Shield, Check, ArrowRight, TrendingDown, Eye, MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";
import analyticsDashboard from "@/assets/analytics-dashboard.png.asset.json";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const plans = [
  {
    name: "Starter",
    price: "R$ 9,90",
    period: "/mês",
    description: "Para quem está começando",
    features: ["5 vídeos", "1.000 plays/mês", "Analytics básico", "Player personalizado", "Suporte por email"],
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para profissionais de marketing",
    features: ["50 vídeos", "25.000 plays/mês", "Analytics avançado", "Testes A/B", "Player 2.0", "Suporte prioritário"],
    popular: true,
  },
  {
    name: "Business",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para equipes e agências",
    features: ["Vídeos ilimitados", "100.000 plays/mês", "Analytics completo", "Testes A/B ilimitados", "API de integração", "Suporte dedicado"],
    popular: false,
  },
];

const testimonials = [
  {
    name: "Mariana Costa",
    role: "Head de Growth, Tropa Digital",
    quote: "Aumentamos a conversão da nossa VSL em 38% no primeiro mês só ajustando o roteiro a partir da curva de retenção do VPlay.",
    initials: "MC",
  },
  {
    name: "Rafael Andrade",
    role: "CEO, Escola Vender Mais",
    quote: "Saímos do Vimeo e do YouTube. O player é rápido, o analytics é cirúrgico e o suporte responde em minutos.",
    initials: "RA",
  },
  {
    name: "Camila Rocha",
    role: "Diretora de Marketing, NovaLead",
    quote: "Os testes A/B do VPlay nos mostraram qual abertura de vídeo realmente prende a atenção. Triplicamos o ROAS da campanha.",
    initials: "CR",
  },
];

const brandLogos = ["Tropa Digital", "Escola Vender Mais", "NovaLead", "Agência Foco", "Mentoria 8 Dígitos", "Lumen Co."];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
              <Play className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-foreground">VPlay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-hero text-primary-foreground border-0">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              🚀 Hospedagem profissional de vídeos
            </span>
          </motion.div>
          <motion.h1
            className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-foreground md:text-6xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Aumente suas conversões com{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              vídeos inteligentes
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Hospede, analise e otimize seus vídeos de vendas. Saiba exatamente onde seus espectadores param e aumente sua taxa de conversão.
          </motion.p>
          <motion.div
            className="mt-8 flex justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/signup">
              <Button size="lg" className="gradient-hero text-primary-foreground border-0 px-8">
                Teste grátis por 14 dias <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
          <motion.div
            className="mx-auto mt-16 max-w-5xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="relative rounded-2xl border bg-card p-2 shadow-2xl shadow-primary/20 ring-1 ring-primary/10">
              <div className="absolute -inset-1 -z-10 rounded-2xl gradient-hero opacity-20 blur-2xl" />
              <img
                src={analyticsDashboard.url}
                alt="Dashboard de analytics do VPlay mostrando curva de retenção, plays, visualizações e play rate"
                className="w-full rounded-xl"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analytics showcase */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                Analytics em tempo real
              </span>
              <h2 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
                Descubra exatamente onde seus espectadores desistem
              </h2>
              <p className="mt-4 text-muted-foreground">
                A curva de retenção segundo a segundo revela os momentos críticos do seu vídeo.
                Saiba onde otimizar o roteiro, onde colocar o CTA e como aumentar suas conversões com dados reais.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: TrendingDown, text: "Curva de retenção interativa com tooltips por segundo" },
                  { icon: Eye, text: "Visualizações, plays únicos e play rate em tempo real" },
                  { icon: MousePointerClick, text: "Pitch automático no maior ponto de queda" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="pt-1 text-sm text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/signup">
                  <Button size="lg" className="gradient-hero text-primary-foreground border-0">
                    Quero ver meus dados <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 rounded-2xl gradient-hero opacity-10 blur-3xl" />
              <img
                src={analyticsDashboard.url}
                alt="Painel de métricas detalhadas do VPlay"
                className="w-full rounded-xl border shadow-xl"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 mb-16">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Empresas que confiam no VPlay
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {brandLogos.map((brand) => (
              <span key={brand} className="text-base font-semibold tracking-tight text-muted-foreground">
                {brand}
              </span>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Tudo que você precisa para vender mais
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Ferramentas profissionais para hospedagem e análise de vídeos de vendas.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Play, title: "Player otimizado", desc: "Player rápido e responsivo com autoplay inteligente" },
              { icon: BarChart3, title: "Analytics detalhado", desc: "Retenção, engajamento e conversão em tempo real" },
              { icon: Zap, title: "Testes A/B", desc: "Compare versões e descubra qual vídeo converte mais" },
              { icon: Shield, title: "Anti-pirataria", desc: "Proteja seus vídeos com DRM e domínio restrito" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-xl border bg-card p-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Quem usa, recomenda
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Mais de 2.000 times de marketing escalam suas VSLs com o VPlay.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                className="rounded-xl border bg-card p-6 shadow-sm"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-3 flex gap-0.5 text-primary" aria-label="Avaliação 5 de 5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-card-foreground">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-secondary/30 py-20" id="pricing">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">Planos e preços</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-xl border p-8 ${
                  plan.popular
                    ? "border-primary bg-card shadow-lg shadow-primary/10 scale-[1.02]"
                    : "bg-card"
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-hero px-4 py-1 text-xs font-medium text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-card-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <Link to="/signup">
                  <Button
                    className={`mt-6 w-full ${plan.popular ? "gradient-hero text-primary-foreground border-0" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Começar agora
                  </Button>
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded gradient-hero">
              <Play className="h-3 w-3 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-semibold text-foreground">VPlay</span>
          </div>
          <p>© 2026 VPlay. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
