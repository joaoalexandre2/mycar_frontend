import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { centrosCustoService, motivosTrocaCentroService, motoristasService, pessoasFrotaService } from "../../services/frota";
import { ConfiguracoesFrota } from "./ConfiguracoesFrota";
import { Pessoas } from "./Pessoas";
import type { PessoaDaFrota } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

// Pessoas também lê os motoristas (para saber quem tem cadastro ligado); por padrão, nenhum.
beforeEach(() => {
  vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
});

const pessoas: PessoaDaFrota[] = [
  { id: 1, name: "Ana Admin", email: "ana@x.com", papel: "administrador", permissoes: [], menus: [] },
  { id: 2, name: "Gil Gestor", email: "gil@x.com", papel: "gestor", permissoes: [], menus: [] },
];

/** A resposta de GET /conta/pessoas: pessoas e os textos do catálogo, numa resposta só. */
const lista = { pessoas, catalogo: {}, menus: {} };

function comUsuario(papel: string, id = 1) {
  const valor = {
    usuario: { id, name: "Ana", email: "ana@x.com", perfil: "frota", papel, permissoes: undefined },
    autenticado: true,
  } as unknown as AuthContextValor;

  return (ui: React.ReactNode) =>
    render(
      <AuthContext.Provider value={valor}>
        <NotificacoesProvider>{ui}</NotificacoesProvider>
      </AuthContext.Provider>,
    );
}

describe("Pessoas e papéis", () => {
  it("lista as pessoas e troca o papel de quem não é a própria pessoa", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue({ ...pessoas[1], papel: "administrador" });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
    expect(screen.getByLabelText("Papel de Ana Admin")).toBeDisabled();

    await usuario.selectOptions(screen.getByLabelText("Papel de Gil Gestor"), "administrador");
    await usuario.click(await screen.findByRole("button", { name: "Tornar administrador" }));

    await waitFor(() => expect(mudar).toHaveBeenCalledWith(2, "administrador"));
  });

  it("convida uma pessoa nova com o papel escolhido", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    const convidar = vi.spyOn(pessoasFrotaService, "convidar").mockResolvedValue({
      id: 3, name: "Lia", email: "lia@x.com", papel: "gestor",
    });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await screen.findByText("Gil Gestor");
    await usuario.type(screen.getByLabelText("Nome"), "Lia");
    await usuario.type(screen.getByLabelText("E-mail"), "lia@x.com");
    await usuario.click(screen.getByRole("button", { name: /Enviar convite/ }));

    await waitFor(() =>
      expect(convidar).toHaveBeenCalledWith({ nome: "Lia", email: "lia@x.com", papel: "gestor" }),
    );
  });

  it("não mostra a aba de pessoas para quem não é administrador", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    const listar = vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);

    comUsuario("gestor")(<ConfiguracoesFrota />);

    expect(await screen.findByRole("tab", { name: /Motivos de troca/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Pessoas e papéis/ })).not.toBeInTheDocument();
    expect(listar).not.toHaveBeenCalled();
  });

  it("mostra a aba de pessoas para o administrador", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    const usuario = userEvent.setup();

    comUsuario("administrador")(<ConfiguracoesFrota />);

    await usuario.click(await screen.findByRole("tab", { name: /Pessoas e papéis/ }));

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
  });
});

describe("Pessoas: confirmações ao trocar o papel", () => {
  const motoristaSemCadastro: PessoaDaFrota = { id: 3, name: "Rui Rua", email: "rui@x.com", papel: "gestor", permissoes: [], menus: [] };
  const listaComRui = { pessoas: [...pessoas, motoristaSemCadastro], catalogo: {}, menus: {} };

  function motoristasComLogin(...userIds: number[]) {
    return vi.spyOn(motoristasService, "listar").mockResolvedValue(
      userIds.map((userId, i) => ({
        id: 100 + i, nome: `Motorista ${i}`, telefone: null, cnhNumero: null, cnhValidade: null, ativo: true, centroCustoId: null, userId,
      })),
    );
  }

  it("promover a administrador pede confirmação explicando o alcance; cancelar não muda nada", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    motoristasComLogin();
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel");
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.selectOptions(await screen.findByLabelText("Papel de Gil Gestor"), "administrador");

    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent("Tornar Gil Gestor administrador?");
    expect(dialogo).toHaveTextContent("Administradores veem e alteram tudo na frota");

    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(mudar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Papel de Gil Gestor")).toHaveValue("gestor");
  });

  it("papel motorista sem cadastro ligado avisa o que falta e não parece pronto", async () => {
    vi.spyOn(pessoasFrotaService, "listar")
      .mockResolvedValueOnce(listaComRui)
      .mockResolvedValue({ ...listaComRui, pessoas: [...pessoas, { ...motoristaSemCadastro, papel: "motorista" }] });
    motoristasComLogin(99);
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue({ ...motoristaSemCadastro, papel: "motorista" });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.selectOptions(await screen.findByLabelText("Papel de Rui Rua"), "motorista");

    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent("Falta o cadastro de motorista");
    expect(dialogo).toHaveTextContent("não consegue reservar veículos");
    expect(dialogo).toHaveTextContent('Cadastros > Motoristas e use "Enviar acesso"');

    await usuario.click(within(dialogo).getByRole("button", { name: "Mudar o papel mesmo assim" }));

    await waitFor(() => expect(mudar).toHaveBeenCalledWith(3, "motorista"));
    expect(await screen.findByText(/agora tem o papel de motorista, mas ainda não consegue reservar/)).toBeInTheDocument();
    expect(screen.queryByText("Rui Rua agora é motorista.")).not.toBeInTheDocument();
    // A pendência continua visível na linha da pessoa depois de recarregar.
    expect(await screen.findByText(/Ainda não consegue reservar: falta um cadastro de motorista/)).toBeInTheDocument();
  });

  it("cancelar o aviso de motorista sem cadastro não muda o papel", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(listaComRui);
    motoristasComLogin();
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel");
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.selectOptions(await screen.findByLabelText("Papel de Rui Rua"), "motorista");
    await usuario.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    expect(mudar).not.toHaveBeenCalled();
  });

  it("papel motorista para quem já tem cadastro ligado muda direto", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(listaComRui);
    motoristasComLogin(3);
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue({ ...motoristaSemCadastro, papel: "motorista" });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.selectOptions(await screen.findByLabelText("Papel de Rui Rua"), "motorista");

    await waitFor(() => expect(mudar).toHaveBeenCalledWith(3, "motorista"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByText("Rui Rua agora é motorista.")).toBeInTheDocument();
  });

  it("sem conseguir ler os motoristas, não afirma que falta cadastro", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue({
      ...listaComRui,
      pessoas: [...pessoas, { ...motoristaSemCadastro, papel: "motorista" }],
    });
    vi.spyOn(motoristasService, "listar").mockRejectedValue(new Error("rede fora"));

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Rui Rua")).toBeInTheDocument();
    expect(screen.queryByText(/falta um cadastro de motorista/)).not.toBeInTheDocument();
  });
});

describe("Pessoas: ligar o login a um cadastro de motorista", () => {
  const rui: PessoaDaFrota = {
    id: 3, name: "Rui Rua", email: "rui@x.com", papel: "motorista", permissoes: [], menus: [], motorista: null,
  };
  const comRui = (pessoa: PessoaDaFrota = rui) => ({ pessoas: [...pessoas, pessoa], catalogo: {}, menus: {} });

  function motoristasCadastrados() {
    return vi.spyOn(motoristasService, "listar").mockResolvedValue([
      { id: 100, nome: "Rui da Silva", telefone: null, cnhNumero: null, cnhValidade: "2035-01-01", ativo: true, centroCustoId: 7, userId: null },
      { id: 101, nome: "Já Tem Login", telefone: null, cnhNumero: null, cnhValidade: null, ativo: true, centroCustoId: null, userId: 50 },
      { id: 102, nome: "Desativado", telefone: null, cnhNumero: null, cnhValidade: null, ativo: false, centroCustoId: null, userId: null },
    ]);
  }

  beforeEach(() => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([
      { id: 7, nome: "Entregas", codigo: null, ativo: true },
      { id: 8, nome: "Antigo", codigo: null, ativo: false },
    ]);
  });

  it("mostra a pendência e a ação para o motorista sem cadastro ligado, com alvo de 44px no celular", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui());
    motoristasCadastrados();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText(/Ainda não consegue reservar: falta um cadastro de motorista/)).toBeInTheDocument();
    const botao = screen.getByRole("button", { name: /Ligar a um motorista: Rui Rua/ });
    expect(botao).toHaveClass("h-11");
  });

  it("com o servidor antigo (sem o campo motorista), não oferece a ação", async () => {
    const semCampo: PessoaDaFrota = { ...rui };
    delete semCampo.motorista;
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui(semCampo));
    motoristasCadastrados();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText(/Ainda não consegue reservar/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ligar a um motorista/ })).not.toBeInTheDocument();
  });

  it("quem já tem cadastro ligado mostra o cadastro e não oferece a ação", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui({ ...rui, motorista: { id: 100, nome: "Rui da Silva" } }));
    motoristasCadastrados();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Cadastro de motorista: Rui da Silva")).toBeInTheDocument();
    expect(screen.queryByText(/Ainda não consegue reservar/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ligar a um motorista/ })).not.toBeInTheDocument();
  });

  it("liga a um motorista cadastrado sem acesso (só os ativos e sem login aparecem)", async () => {
    vi.spyOn(pessoasFrotaService, "listar")
      .mockResolvedValueOnce(comRui())
      .mockResolvedValue(comRui({ ...rui, motorista: { id: 100, nome: "Rui da Silva" } }));
    motoristasCadastrados();
    const ligar = vi.spyOn(pessoasFrotaService, "ligarMotorista").mockResolvedValue({ ...rui, motorista: { id: 100, nome: "Rui da Silva" } });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: /Ligar a um motorista: Rui Rua/ }));
    const dialogo = await screen.findByRole("dialog", { name: /Ligar a um motorista/ });

    const select = within(dialogo).getByLabelText("Motorista sem acesso");
    const opcoes = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(["Escolha o motorista", "Rui da Silva"]);

    await usuario.selectOptions(select, "100");
    await usuario.click(within(dialogo).getByRole("button", { name: "Ligar" }));

    await waitFor(() => expect(ligar).toHaveBeenCalledWith(3, { motorista_id: 100 }));
    expect(await screen.findByText(/Rui Rua agora está ligado ao cadastro de motorista Rui da Silva/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByText("Cadastro de motorista: Rui da Silva")).toBeInTheDocument();
  });

  it("cria o cadastro a partir da pessoa e exige o centro de custo", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui());
    motoristasCadastrados();
    const ligar = vi.spyOn(pessoasFrotaService, "ligarMotorista").mockResolvedValue({ ...rui, motorista: { id: 200, nome: "Rui Rua" } });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: /Ligar a um motorista: Rui Rua/ }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("radio", { name: /Criar o cadastro com o nome Rui Rua/ }));

    const centro = within(dialogo).getByLabelText(/Centro de custo/);
    // Só os centros ativos (mais a opção vazia).
    await waitFor(() => expect(within(centro).getAllByRole("option")).toHaveLength(2));

    await usuario.click(within(dialogo).getByRole("button", { name: "Ligar" }));

    expect(ligar).not.toHaveBeenCalled();
    expect(centro).toHaveAttribute("aria-invalid", "true");
    expect(centro).toHaveAccessibleDescription(/Escolha o centro de custo/);
    expect(centro).toHaveFocus();

    await usuario.selectOptions(centro, "7");
    await usuario.type(within(dialogo).getByLabelText("Número da CNH"), "12345");
    await usuario.click(within(dialogo).getByRole("button", { name: "Ligar" }));

    await waitFor(() =>
      expect(ligar).toHaveBeenCalledWith(3, { centro_custo_id: 7, cnh_numero: "12345", cnh_validade: null }),
    );
  });

  it("sem motorista disponível, já abre em criar o cadastro", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui());
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: /Ligar a um motorista: Rui Rua/ }));
    const dialogo = await screen.findByRole("dialog");

    expect(within(dialogo).getByRole("radio", { name: /já cadastrado/ })).toBeDisabled();
    expect(within(dialogo).getByRole("radio", { name: /Criar o cadastro/ })).toBeChecked();
    expect(dialogo).toHaveTextContent("Nenhum motorista ativo sem acesso cadastrado");
  });

  it("erro do servidor aparece no diálogo, anunciado, e o diálogo continua aberto", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comRui());
    motoristasCadastrados();
    vi.spyOn(pessoasFrotaService, "ligarMotorista").mockRejectedValue(new Error("falhou"));
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: /Ligar a um motorista: Rui Rua/ }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.selectOptions(within(dialogo).getByLabelText("Motorista sem acesso"), "100");
    await usuario.click(within(dialogo).getByRole("button", { name: "Ligar" }));

    expect(await within(dialogo).findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("trocar o papel para motorista aponta para a nova ação, não para Cadastros", async () => {
    const gestorSemCadastro: PessoaDaFrota = { ...rui, papel: "gestor" };
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValueOnce(comRui(gestorSemCadastro)).mockResolvedValue(comRui());
    motoristasCadastrados();
    vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue(rui);
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.selectOptions(await screen.findByLabelText("Papel de Rui Rua"), "motorista");
    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent('use "Ligar a um motorista" nesta tela');
    expect(dialogo).not.toHaveTextContent("Cadastros > Motoristas");

    await usuario.click(within(dialogo).getByRole("button", { name: "Mudar o papel mesmo assim" }));

    expect(await screen.findByRole("button", { name: /Ligar a um motorista: Rui Rua/ })).toBeInTheDocument();
  });
});

describe("Pessoas: estado de acesso e reenvio do convite", () => {
  const carla: PessoaDaFrota = {
    id: 5, name: "Carla Convidada", email: "carla@x.com", papel: "gestor", permissoes: [], menus: [], motorista: null, acesso: "convite_enviado",
  };
  const comAcesso = (...extras: PessoaDaFrota[]) => ({
    pessoas: [
      { ...pessoas[0], motorista: null, acesso: "ativo" as const },
      { ...pessoas[1], motorista: null, acesso: "ativo" as const },
      ...extras,
    ],
    catalogo: {},
    menus: {},
  });

  /** Erro como o axios entrega (isAxiosError + status + corpo do Laravel). */
  const erroHttp = (status: number, message: string) =>
    Object.assign(new Error(String(status)), { isAxiosError: true, response: { status, data: { message } } });

  it("mostra quem ainda não entrou e oferece o reenvio só a essa pessoa, com alvo de 44px no celular", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comAcesso(carla));

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Convite enviado: ainda não entrou no sistema.")).toBeInTheDocument();
    expect(screen.getAllByText("Já entrou no sistema.")).toHaveLength(2);

    const botao = screen.getByRole("button", { name: "Reenviar convite para Carla Convidada" });
    expect(botao).toHaveClass("h-11");
    expect(botao).toHaveClass("md:h-9");
    expect(screen.getAllByRole("button", { name: /Reenviar convite/ })).toHaveLength(1);
  });

  it("reenvia e confirma na tela para qual e-mail foi", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comAcesso(carla));
    const reenviar = vi.spyOn(pessoasFrotaService, "reenviarConvite").mockResolvedValue({ mensagem: "Convite reenviado para carla@x.com." });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    const botao = await screen.findByRole("button", { name: "Reenviar convite para Carla Convidada" });
    botao.focus();
    await usuario.keyboard("{Enter}");

    expect(reenviar).toHaveBeenCalledWith(5);
    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("Convite reenviado para carla@x.com.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sem mensagem do servidor, monta a confirmação com o e-mail da pessoa", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comAcesso(carla));
    vi.spyOn(pessoasFrotaService, "reenviarConvite").mockResolvedValue({ mensagem: null });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: "Reenviar convite para Carla Convidada" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Convite reenviado para carla@x.com.");
  });

  it("429: orienta a esperar um minuto, num alerta", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(comAcesso(carla));
    vi.spyOn(pessoasFrotaService, "reenviarConvite").mockRejectedValue(erroHttp(429, "Too Many Attempts."));
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: "Reenviar convite para Carla Convidada" }));

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Acabamos de enviar um convite para Carla Convidada. Aguarde um minuto e tente reenviar de novo.");
    expect(alerta).not.toHaveTextContent("Too Many");
    expect(screen.getByRole("button", { name: "Reenviar convite para Carla Convidada" })).toBeEnabled();
  });

  it("422 (já entrou): mostra a mensagem do servidor e atualiza a lista sem apagar o alerta", async () => {
    vi.spyOn(pessoasFrotaService, "listar")
      .mockResolvedValueOnce(comAcesso(carla))
      .mockResolvedValue(comAcesso({ ...carla, acesso: "ativo" }));
    vi.spyOn(pessoasFrotaService, "reenviarConvite").mockRejectedValue(
      erroHttp(422, 'Esta pessoa já entra no sistema. Se esqueceu a senha, ela pode usar "Esqueci minha senha".'),
    );
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await usuario.click(await screen.findByRole("button", { name: "Reenviar convite para Carla Convidada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta pessoa já entra no sistema.");
    await waitFor(() => expect(screen.queryByRole("button", { name: /Reenviar convite/ })).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Esta pessoa já entra no sistema.");
    expect(screen.getAllByText("Já entrou no sistema.")).toHaveLength(3);
  });

  it("com o servidor antigo (sem o campo acesso), não afirma o estado nem oferece o reenvio", async () => {
    const semCampo: PessoaDaFrota = { ...carla };
    delete semCampo.acesso;
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue({ pessoas: [...pessoas, semCampo], catalogo: {}, menus: {} });

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Carla Convidada")).toBeInTheDocument();
    expect(screen.queryByText(/ainda não entrou/)).not.toBeInTheDocument();
    expect(screen.queryByText("Já entrou no sistema.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar convite/ })).not.toBeInTheDocument();
  });

  it("não oferece o reenvio para a própria pessoa logada", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue({
      pessoas: [{ ...pessoas[0], acesso: "convite_enviado" }],
      catalogo: {},
      menus: {},
    });

    comUsuario("administrador", 1)(<Pessoas />);

    expect(await screen.findByText("Ana Admin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar convite/ })).not.toBeInTheDocument();
  });
});
