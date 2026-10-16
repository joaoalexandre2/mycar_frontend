import { EMAIL_CONTATO, PaginaLegal, Secao } from "./PaginaLegal";

export function Privacidade() {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      atualizadoEm="15 de outubro de 2026"
    >
      <p>
        Esta política explica quais dados o MyCar coleta, para que os usa e
        quais são os seus direitos, conforme a Lei Geral de Proteção de Dados
        (LGPD, Lei 13.709/2018).
      </p>

      <Secao titulo="1. Dados que coletamos">
        <ul className="list-disc pl-5">
          <li>
            <strong>Cadastro:</strong> nome, e-mail e senha (guardada de forma
            criptografada).
          </li>
          <li>
            <strong>Login com Google ou Facebook:</strong> recebemos apenas o
            seu nome, e-mail e um identificador da conta no provedor. Não
            acessamos seus contatos, publicações, e-mails ou outros dados.
          </li>
          <li>
            <strong>Uso do sistema:</strong> veículos, manutenções,
            abastecimentos, documentos, fotos e demais informações que você
            mesmo cadastra.
          </li>
          <li>
            <strong>Técnicos:</strong> tipo de aparelho/navegador e data do
            último acesso, para manter suas sessões seguras.
          </li>
        </ul>
      </Secao>

      <Secao titulo="2. Para que usamos">
        <p>
          Para autenticar você, fornecer as funções do MyCar, enviar e-mails de
          confirmação, redefinição de senha e lembretes que você ativar, e
          manter a segurança do serviço. Não vendemos seus dados nem os usamos
          para publicidade.
        </p>
      </Secao>

      <Secao titulo="3. Compartilhamento">
        <p>
          Seus dados não são compartilhados com terceiros, exceto prestadores
          necessários ao funcionamento (como hospedagem e envio de e-mails) e
          quando a lei exigir.
        </p>
      </Secao>

      <Secao titulo="4. Armazenamento e segurança">
        <p>
          Os dados ficam em servidores protegidos, com acesso restrito e
          comunicação criptografada. Mantemos as informações enquanto sua conta
          estiver ativa ou pelo tempo exigido por lei.
        </p>
      </Secao>

      <Secao titulo="5. Seus direitos">
        <p>
          Você pode solicitar acesso, correção, exportação ou exclusão dos seus
          dados, e revogar o acesso do Google ou do Facebook ao MyCar a
          qualquer momento nas configurações da sua conta no provedor.
        </p>
      </Secao>

      <Secao titulo="6. Contato">
        <p>
          Para exercer seus direitos ou tirar dúvidas, escreva para{" "}
          <a
            href={`mailto:${EMAIL_CONTATO}`}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            {EMAIL_CONTATO}
          </a>
          .
        </p>
      </Secao>
    </PaginaLegal>
  );
}
