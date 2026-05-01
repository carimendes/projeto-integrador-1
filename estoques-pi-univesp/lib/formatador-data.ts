export function formatarData(dataIso) {
  const data = new Date(dataIso);
  const formatada = new Intl.DateTimeFormat("pt-BR").format(data);
  return formatada
};