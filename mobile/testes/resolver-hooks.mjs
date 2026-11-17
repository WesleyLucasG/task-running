export async function resolve(especificador, contexto, proximo) {
  try {
    return await proximo(especificador, contexto);
  } catch (erro) {
    if (especificador.startsWith('.') && !especificador.endsWith('.ts')) {
      return proximo(`${especificador}.ts`, contexto);
    }
    throw erro;
  }
}
