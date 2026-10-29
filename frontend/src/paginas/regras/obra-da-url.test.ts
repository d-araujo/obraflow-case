import { describe, expect, it } from 'vitest';
import { linkDasRegras, resolverObra } from './obra-da-url';

const obras = [{ id: 2 }, { id: 3 }, { id: 1 }];

describe('resolverObra', () => {
  it('usa a obra da URL quando ela existe', () => {
    expect(resolverObra('3', obras)).toBe(3);
  });

  it('cai na primeira obra sem parâmetro, com id inexistente ou malformado', () => {
    expect(resolverObra(null, obras)).toBe(2);
    expect(resolverObra('999', obras)).toBe(2);
    expect(resolverObra('abc', obras)).toBe(2);
  });

  it('devolve null quando não há obras', () => {
    expect(resolverObra('3', [])).toBeNull();
  });
});

describe('linkDasRegras', () => {
  it('leva às regras com a obra selecionada', () => {
    expect(linkDasRegras(3)).toBe('/regras?obra=3');
  });
});
