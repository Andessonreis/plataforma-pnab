/**
 * Ajuste dos campos de `ui` sobre o papel. As primitivas pintam dica e erro
 * em slate-500 e red-600, pensadas para cartão branco; sobre o papel ficam
 * abaixo de 4,5:1. Aqui só escurecem, sem mexer na primitiva compartilhada.
 * `acesso` traz o corpo de 16px e a altura de 48px das telas de acesso.
 */
export const camposNoPapel = "acesso [&_[id$='-hint']]:text-tinta-700 [&_[id$='-error']]:text-red-800"
