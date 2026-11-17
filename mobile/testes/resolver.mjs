// Permite importar os módulos .ts do app sem extensão (como o Metro faz)
import { register } from 'node:module';
register('./resolver-hooks.mjs', import.meta.url);
