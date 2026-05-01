export function formatarData(dataIso: string) {
  const data = new Date(dataIso);
  const formatada = new Intl.DateTimeFormat("pt-BR").format(data);
  return formatada
};