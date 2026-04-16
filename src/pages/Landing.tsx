import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, BarChart3, Zap, Shield, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const plans = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    description: "Para quem está começando",
    features: ["5 vídeos", "1.000 plays/mês", "Analytics básico", "Player personalizado", "Suporte por email"],
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    period: "/mês",
    description: "Para profissionais de marketing",
    features: ["50 vídeos", "25.000 plays/mês", "Analytics avançado", "Testes A/B", "Player 2.0", "Suporte prioritário"],
    popular: true,
  },
  {
    name: "Business",
    price: "R$ 497",
    period: "/mês",
    description: "Para equipes e agências",
    features: ["Vídeos ilimitados", "100.000 plays/mês", "Analytics completo", "Testes A/B ilimitados", "API de integração", "Suporte dedicado"],
    popular: false,
  },
];

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
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20">
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
