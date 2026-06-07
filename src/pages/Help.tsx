import { DashboardLayout } from "@/components/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, MessageCircle, BookOpen } from "lucide-react";

const faqs = [
  {
    q: "Como faço upload de um vídeo?",
    a: "No painel 'Meus vídeos', clique no botão 'Upload' no canto superior direito e selecione o arquivo do seu computador.",
  },
  {
    q: "Como incorporo o vídeo no meu site?",
    a: "Na lista de vídeos, clique no ícone de código (< >) ao lado do vídeo desejado e copie o snippet de embed.",
  },
  {
    q: "Como acompanho as métricas?",
    a: "Acesse o vídeo e clique em 'Analytics' para ver retenção, plays, dispositivos, países e mais.",
  },
  {
    q: "Posso trocar de plano a qualquer momento?",
    a: "Sim. Vá em 'Planos' no menu lateral e escolha o que melhor se encaixa. A mudança é imediata.",
  },
  {
    q: "Meus dados ficam salvos se o teste expirar?",
    a: "Sim. Os vídeos e métricas permanecem armazenados. Basta escolher um plano pago para voltar a usar.",
  },
];

export default function Help() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <BookOpen className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-base">Documentação</CardTitle>
              <CardDescription>Guias e tutoriais</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <MessageCircle className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-base">Chat ao vivo</CardTitle>
              <CardDescription>Fale com nosso time</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Mail className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-base">E-mail</CardTitle>
              <CardDescription>suporte@vplay.com.br</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <a href="mailto:suporte@vplay.com.br">Falar com suporte</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
