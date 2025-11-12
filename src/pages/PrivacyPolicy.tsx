import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples para páginas legais */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MoFleet" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">MoFleet</h1>
          </div>
        </div>
      </header>
      <div className="p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O MoFleet é um sistema de gestão de alugueres de veículos desenvolvido e operado pela <strong>Expresso Kiuvo</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                O MoFleet ("nós", "nosso" ou "aplicativo") está comprometido em proteger sua privacidade. Esta Política 
                de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você usa 
                nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.1. Informações da Conta</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quando você cria uma conta, coletamos informações como nome, endereço de email, nome da empresa e 
                    outras informações necessárias para configurar sua conta.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.2. Dados de Uso</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletamos informações sobre como você usa nosso serviço, incluindo ações realizadas, páginas visitadas 
                    e funcionalidades utilizadas.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.3. Dados de Negócio</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Você pode inserir dados relacionados ao seu negócio, incluindo informações sobre veículos, clientes, 
                    reservas e transações. Esses dados são de sua propriedade e responsabilidade.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.4. Informações Técnicas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletamos automaticamente informações técnicas como endereço IP, tipo de navegador, sistema operacional 
                    e informações do dispositivo.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Como Usamos Suas Informações</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">Usamos as informações coletadas para:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Fornecer, manter e melhorar nosso serviço</li>
                <li>Processar transações e gerenciar sua conta</li>
                <li>Enviar notificações e comunicações relacionadas ao serviço</li>
                <li>Detectar, prevenir e resolver problemas técnicos</li>
                <li>Cumprir obrigações legais e proteger nossos direitos</li>
                <li>Personalizar sua experiência no aplicativo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Prestadores de Serviços:</strong> Podemos compartilhar informações com prestadores de serviços que nos ajudam a operar nosso serviço (como hospedagem de dados, processamento de pagamentos)</li>
                <li><strong>Obrigações Legais:</strong> Podemos divulgar informações se exigido por lei ou em resposta a solicitações legais válidas</li>
                <li><strong>Proteção de Direitos:</strong> Podemos divulgar informações para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários</li>
                <li><strong>Com seu Consentimento:</strong> Podemos compartilhar informações com seu consentimento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações 
                contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados, 
                controles de acesso e monitoramento regular de segurança.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Retemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta 
                política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Seus Direitos</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">Você tem o direito de:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Acessar suas informações pessoais</li>
                <li>Corrigir informações imprecisas ou incompletas</li>
                <li>Solicitar a exclusão de suas informações pessoais</li>
                <li>Opor-se ao processamento de suas informações pessoais</li>
                <li>Solicitar a portabilidade de seus dados</li>
                <li>Retirar seu consentimento a qualquer momento</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Para exercer esses direitos, entre em contato conosco através das informações fornecidas na seção de Contato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground leading-relaxed">
                Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço e 
                personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Privacidade de Menores</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nosso serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente informações pessoais 
                de menores. Se descobrirmos que coletamos informações de um menor, tomaremos medidas para excluir essas 
                informações imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Transferências Internacionais</h2>
              <p className="text-muted-foreground leading-relaxed">
                Suas informações podem ser transferidas e mantidas em servidores localizados fora do seu país. Ao usar 
                nosso serviço, você consente com a transferência de suas informações para esses servidores.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações 
                significativas publicando a nova política nesta página e atualizando a data de "Última atualização".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre como tratamos suas 
                informações pessoais, entre em contato com a <strong>Expresso Kiuvo</strong> através das informações de contato fornecidas em nossa 
                página de Configurações.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer simples */}
      <footer className="border-t bg-muted/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 MoFleet - Expresso Kiuvo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;

