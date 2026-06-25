import React from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SupportPage = () => {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Suporte</h1>
        <p className="text-lg text-muted-foreground">Estamos aqui para ajudar com o que você precisar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Frequently Asked Questions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Como faço um pedido?</AccordionTrigger>
              <AccordionContent>
                Você pode fazer um pedido navegando até nossa página "Cardápio", selecionando suas pizzas e coberturas desejadas e, em seguida, prosseguindo para o checkout.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Quais são as opções de entrega?</AccordionTrigger>
              <AccordionContent>
                Oferecemos entrega padrão em um raio de 8 km. Os tempos de entrega geralmente variam de 30 a 45 minutos. Você pode rastrear seu pedido em tempo real na sua página de perfil.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Posso personalizar minha pizza?</AccordionTrigger>
              <AccordionContent>
                Sim, com certeza! Na página de detalhes de cada produto, você pode escolher o tamanho e adicionar várias coberturas para criar sua pizza perfeita.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Quais métodos de pagamento vocês aceitam?</AccordionTrigger>
              <AccordionContent>
                Aceitamos todos os principais cartões de crédito (Visa, MasterCard, American Express) e também oferecemos pagamento através de carteiras digitais populares.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Contact Us */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Entre em Contato</h2>
          <div className="grid gap-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">Telefone</CardTitle>
                  <p className="text-muted-foreground">Disponível das 10h às 22h</p>
                  <p className="font-medium">(123) 456-7890</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">E-mail</CardTitle>
                  <p className="text-muted-foreground">Resposta em até 24 horas</p>
                  <p className="font-medium">support@pizzapalace.com</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="flex items-center gap-4 p-6">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <CardTitle className="text-lg">Chat ao Vivo</CardTitle>
                  <p className="text-primary-foreground/80">Converse conosco agora</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;