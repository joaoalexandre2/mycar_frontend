import { EMAIL_CONTATO, PaginaLegal, Secao } from "./PaginaLegal";

export function Termos() {
  return (
    <PaginaLegal
      titulo="Termos de Serviço"
      atualizadoEm="15 de outubro de 2026"
    >
      <p>
        Ao criar uma conta ou entrar no MyCar, você concorda com estes termos.
      </p>

      <Secao titulo="1. O serviço">
        <p>
          O MyCar ajuda a organizar informações de veículos: manutenções,
          abastecimentos, documentos, seguros e lembretes, para oficinas,
          pessoas e frotas.
        </p>
      </Secao>

      <Secao titulo="2. Sua conta">
        <p>
          Você é responsável por manter a senha e o acesso à sua conta em
          segurança e pelas informações que cadastra. Entrar com Google ou
          Facebook vincula sua conta do MyCar ao e-mail desse provedor.
        </p>
      </Secao>

      <Secao titulo="3. Uso adequado">
        <p>
          É proibido usar o serviço para fins ilegais, tentar acessar dados de
          outras pessoas, sobrecarregar ou comprometer a segurança da
          plataforma.
        </p>
      </Secao>

      <Secao titulo="4. Seu conteúdo">
        <p>
          As informações e arquivos que você cadastra continuam sendo seus. Você
          nos autoriza a armazená-los e processá-los apenas para prestar o
          serviço.
        </p>
      </Secao>

      <Secao titulo="5. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter o serviço disponível, mas ele pode sofrer
          interrupções. Valores de tabelas (como FIPE), alertas e estimativas
          são informativos e podem conter diferenças em relação às fontes
          oficiais.
        </p>
      </Secao>

      <Secao titulo="6. Encerramento">
        <p>
          Você pode parar de usar o MyCar e pedir a exclusão da conta a
          qualquer momento. Podemos suspender contas que violem estes termos.
        </p>
      </Secao>

      <Secao titulo="7. Contato">
        <p>
          Dúvidas:{" "}
          <a
            href={`mailto:${EMAIL_CONTATO}`}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            {EMAIL_CONTATO}
          </a>
          . Veja também nossa{" "}
          <a
            href="/privacidade"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Política de Privacidade
          </a>
          .
        </p>
      </Secao>
    </PaginaLegal>
  );
}
