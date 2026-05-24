import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const api = readFileSync('api/generate.js', 'utf8');

const checks = [
  ['trilha por fases', html.includes('Mapa da Palavra') && html.includes('phase-node')],
  ['estudo ilimitado no dia', html.includes('quantas fases quiser no mesmo dia')],
  ['botão próxima fase', html.includes('id="next-lesson"') && html.includes('continuePath')],
  ['sugestão de versículo pela IA', html.includes('id="suggest-verse"') && html.includes('suggestVerse') && !html.includes('Sugestão local')],
  ['API modo suggest', api.includes("mode === 'suggest'") && api.includes('Sugira a próxima fase de estudo bíblico')],
  ['perguntas bíblicas, não institucionais', html.includes('generateQuizAI') && !html.includes('Qual é o objetivo principal de um estudo bíblico no Trilha VIVA')],
  ['expansões ativadas', html.includes('tab-expansions') && html.includes('startFlashcards') && html.includes('startBattle') && html.includes('startPastor')],
  ['modos infantil jovem seminário', html.includes("startMode('child')") && html.includes("startMode('youth')") && html.includes("startMode('seminary')")],
  ['memorização e leitura narrada', html.includes('startMemorization') && html.includes('startReading')],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('❌ Feature test falhou:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}
console.log('✅ Feature test OK: trilha, quizzes bíblicos e expansões validadas.');

if (html.includes('offline-study') || html.includes('localStudyPayload') || api.includes('localFallback')) { console.error('❌ Fallback local proibido encontrado.'); process.exit(1); }
