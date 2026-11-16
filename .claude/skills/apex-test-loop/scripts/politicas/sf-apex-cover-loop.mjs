// Política do odin-guard para esta skill (ADR 0027 do Odin): as mesmas regras do guard.mjs, aplicadas depois do `odin ensure sf-apex-cover-loop`.
// Comando destrutivo, estado do loop fora da allowlist, conclusão sem o Portão 2 e arquivo fora do lugar.
import { classify, classifyConclusion, classifySelfContainment, classifyStateWrite, classifyStrayFile, classifyWrite } from '../guard.mjs';

export default function politica(evento) {
  const ti = evento?.tool_input ?? {};
  let v = { blocked: false };
  if (ti.command !== undefined) v = classify(ti.command);
  else if (ti.file_path !== undefined) {
    const conteudo = ti.content ?? ti.new_string;
    v = classifyWrite(ti.file_path);
    if (!v.blocked) v = classifyStateWrite(ti.file_path);
    if (!v.blocked) v = classifyConclusion(ti.file_path, conteudo);
    if (!v.blocked) v = classifySelfContainment(ti.file_path, conteudo);
    if (!v.blocked) v = classifyStrayFile(ti.file_path);
  } else v = classify(JSON.stringify(ti));
  return v.blocked ? { decisao: v.decision === 'ask' ? 'perguntar' : 'negar', motivo: v.why } : null;
}
