# Diretriz de Conformidade TypeScript e Qualidade Contínua

## Regras Obrigatórias para Qualquer Mudança no Código

1. **Validação Rigorosa de TypeScript (`npm run typecheck` & `tsc -b`):**
   - Todos os arquivos `.ts` e `.tsx` criados ou editados devem compilar estritamente sem nenhum erro do TypeScript (`noUnusedLocals`, `noUnusedParameters`, strict types).
   - Nunca utilizar imports desnecessários ou tipos `any` inseguros.
   - Sempre executar `npm run typecheck` e `npm run build` (que executa `tsc -b`) antes de considerar qualquer tarefa finalizada.

2. **Conformidade de Linter (`npm run lint`):**
   - Nenhum erro ou warning do ESLint é permitido.
   - Respeitar as regras de hooks do React (não chamar `setState` síncrono dentro de effects, exportar componentes de forma correta para Fast Refresh).

3. **Garantia de Testes (`npm test` & `npm run test:coverage`):**
   - Toda funcionalidade ou sistema novo deve possuir testes unitários correspondentes.
   - Nenhuma entrega pode quebrar testes existentes.
   - Os limiares de cobertura configurados no Vitest devem ser sempre cumpridos ou superados.
