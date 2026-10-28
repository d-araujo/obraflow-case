import {
  descreverFaltaDeFaixa,
  FaixaDaRegra,
  montarCadeia,
  ResultadoCadeia,
} from './cadeia.js';

const ANA = 1;
const BRUNO = 2;
const CARLA = 3;

function faixa(
  limiteMaximo: string | null,
  ...aprovadores: number[]
): FaixaDaRegra {
  return {
    limiteMaximo,
    aprovadores: aprovadores.map((usuarioId, i) => ({
      usuarioId,
      ordem: i + 1,
    })),
  };
}

function aprovadores(resultado: ResultadoCadeia): number[] {
  if (!resultado.aplicavel) throw new Error(`sem faixa: ${resultado.motivo}`);
  return resultado.etapas.map((etapa) => etapa.aprovadorId);
}

const tresNiveis = [
  faixa('10000.00', ANA),
  faixa('50000.00', BRUNO),
  faixa(null, CARLA),
];

describe('montarCadeia', () => {
  it('faixa única: o pedido dentro do limite passa só pelos aprovadores dela', () => {
    const resultado = montarCadeia([faixa('10000.00', ANA, BRUNO)], '800');

    expect(resultado).toEqual({
      aplicavel: true,
      etapas: [
        { ordem: 1, aprovadorId: ANA },
        { ordem: 2, aprovadorId: BRUNO },
      ],
    });
  });

  it('cumulativo: acumula as faixas anteriores até a faixa do total', () => {
    expect(aprovadores(montarCadeia(tresNiveis, '9000'))).toEqual([ANA]);
    expect(aprovadores(montarCadeia(tresNiveis, '30000'))).toEqual([
      ANA,
      BRUNO,
    ]);
    expect(aprovadores(montarCadeia(tresNiveis, '80000'))).toEqual([
      ANA,
      BRUNO,
      CARLA,
    ]);
  });

  it('cumulativo: reproduz o exemplo do enunciado (João, depois Amanda)', () => {
    const [JOAO, AMANDA] = [10, 20];
    const regra = [faixa('10000.00', JOAO), faixa(null, AMANDA)];

    expect(aprovadores(montarCadeia(regra, '8000'))).toEqual([JOAO]);
    expect(aprovadores(montarCadeia(regra, '12500'))).toEqual([JOAO, AMANDA]);
  });

  it('duplicata: aprovador repetido fica só na primeira ocorrência', () => {
    const regra = [faixa('10000.00', ANA, BRUNO), faixa(null, BRUNO, CARLA)];

    expect(montarCadeia(regra, '20000')).toEqual({
      aplicavel: true,
      etapas: [
        { ordem: 1, aprovadorId: ANA },
        { ordem: 2, aprovadorId: BRUNO },
        { ordem: 3, aprovadorId: CARLA },
      ],
    });
  });

  it('limite exato: "até X" inclui X', () => {
    expect(aprovadores(montarCadeia(tresNiveis, '10000.00'))).toEqual([ANA]);
    expect(aprovadores(montarCadeia(tresNiveis, '10000.01'))).toEqual([
      ANA,
      BRUNO,
    ]);
    expect(aprovadores(montarCadeia(tresNiveis, '50000'))).toEqual([
      ANA,
      BRUNO,
    ]);
  });

  it('sem faixa: obra sem regras não gera cadeia', () => {
    expect(montarCadeia([], '100')).toEqual({
      aplicavel: false,
      motivo: 'OBRA_SEM_FAIXAS',
    });
  });

  it('sem faixa: total acima do maior limite, sem faixa sem teto', () => {
    const resultado = montarCadeia(
      [faixa('10000.00', ANA), faixa('50000.00', BRUNO)],
      '50000.01',
    );

    expect(resultado.aplicavel).toBe(false);
    if (resultado.aplicavel || resultado.motivo !== 'ACIMA_DO_MAIOR_LIMITE') {
      throw new Error('motivo inesperado');
    }
    expect(resultado.maiorLimite.toFixed(2)).toBe('50000.00');
  });

  it('sem teto: a faixa sem limite cobre qualquer valor e fica por último', () => {
    expect(aprovadores(montarCadeia([faixa(null, CARLA)], '1'))).toEqual([
      CARLA,
    ]);
    expect(aprovadores(montarCadeia(tresNiveis, '999999999999.99'))).toEqual([
      ANA,
      BRUNO,
      CARLA,
    ]);
  });

  it('não depende da ordem de entrada das faixas nem dos aprovadores', () => {
    const embaralhadas: FaixaDaRegra[] = [
      faixa(null, CARLA),
      {
        limiteMaximo: '10000.00',
        aprovadores: [
          { usuarioId: BRUNO, ordem: 2 },
          { usuarioId: ANA, ordem: 1 },
        ],
      },
    ];

    expect(aprovadores(montarCadeia(embaralhadas, '20000'))).toEqual([
      ANA,
      BRUNO,
      CARLA,
    ]);
  });

  it('total zero cai na primeira faixa', () => {
    expect(aprovadores(montarCadeia(tresNiveis, '0'))).toEqual([ANA]);
  });
});

describe('descreverFaltaDeFaixa', () => {
  it('explica a obra sem regras', () => {
    expect(
      descreverFaltaDeFaixa(
        { aplicavel: false, motivo: 'OBRA_SEM_FAIXAS' },
        'Galpão Lauro',
        '100',
      ),
    ).toContain('A obra "Galpão Lauro" não tem faixas de alçada');
  });

  it('mostra total e maior limite formatados em reais', () => {
    const resultado = montarCadeia([faixa('10000.00', ANA)], '12500.5');
    if (resultado.aplicavel) throw new Error('deveria faltar faixa');

    expect(descreverFaltaDeFaixa(resultado, 'Aurora', '12500.5')).toBe(
      'O total de R$ 12.500,50 ultrapassa o maior limite da obra "Aurora" ' +
        '(R$ 10.000,00) e não há faixa sem teto. Ajuste as regras de alçada.',
    );
  });
});
