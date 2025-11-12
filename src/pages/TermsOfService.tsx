import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
            <CardTitle className="text-3xl">Termos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Informações da Empresa</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O MoFleet é um sistema de gestão de alugueres de veículos desenvolvido e operado pela <strong>Expresso Kiuvo</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar o MoFleet, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
                Se você não concorda com alguma parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao criar uma conta no MoFleet, você declara que leu, compreendeu e concorda com estes Termos de Uso e com nossa 
                Política de Privacidade. Se você não concorda com alguma parte destes termos, não deve criar uma conta ou usar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O MoFleet é um sistema de gestão de alugueres de veículos que permite aos usuários gerenciar reservas, 
                frotas, clientes e relatórios relacionados ao negócio de alugueres de veículos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Conta de Usuário</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  Para usar o MoFleet, você precisa criar uma conta fornecendo informações precisas e completas.
                </p>
                <p className="leading-relaxed">
                  Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades 
                  que ocorrem sob sua conta.
                </p>
                <p className="leading-relaxed">
                  Você concorda em notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Uso Aceitável</h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">Você concorda em não:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Usar o serviço para qualquer propósito ilegal ou não autorizado</li>
                <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
                <li>Transmitir qualquer vírus, malware ou código malicioso</li>
                <li>Tentar obter acesso não autorizado ao sistema ou a outras contas</li>
                <li>Interferir ou interromper o funcionamento do serviço</li>
                <li>Usar o serviço para enviar spam ou comunicações não solicitadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do MoFleet, incluindo mas não limitado a textos, gráficos, logos, ícones, imagens, 
                clipes de áudio, downloads digitais e compilações de dados, é propriedade do MoFleet ou de seus 
                fornecedores de conteúdo e está protegido por leis de direitos autorais e outras leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Dados e Privacidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você mantém todos os direitos sobre os dados que você insere no sistema. Nós nos comprometemos a proteger 
                sua privacidade e a segurança de seus dados conforme descrito em nossa Política de Privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                O MoFleet é fornecido "como está" e "conforme disponível". Não garantimos que o serviço será ininterrupto, 
                seguro ou livre de erros. Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, 
                indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Modificações do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar ou descontinuar o serviço (ou qualquer parte dele) a qualquer momento, 
                com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por qualquer modificação, 
                suspensão ou descontinuação do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Rescisão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, 
                incluindo, mas não limitado a, violação destes Termos de Uso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Alterações nos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor 
                imediatamente após a publicação. O uso continuado do serviço após tais alterações constitui sua aceitação 
                dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos de Uso serão regidos e interpretados de acordo com as leis de Angola, sem dar efeito a 
                quaisquer princípios de conflitos de leis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato com a <strong>Expresso Kiuvo</strong> através das informações 
                de contato fornecidas em nossa página de Configurações.
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

export default TermsOfService;

