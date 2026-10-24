import assert from 'node:assert/strict';
import { generateChart, setBrightnessSchool } from '../../lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '../../lib/ziwei/types';

// 亮度流派按次传入（opts.brightnessSchool），不改模块默认值，多用户共用进程时互不串扰
const cases: BirthInfo[] = [
  { year: 1990, month: 6, day: 15, hour: 6, gender: 'male' },
  { year: 1985, month: 11, day: 3, hour: 0, gender: 'female' },
  { year: 2001, month: 2, day: 20, hour: 9, gender: 'male' },
];

const brightness = (chart: ZiweiChart) =>
  chart.palaces.map((p) => p.stars.map((s) => `${p.branch}:${s.name}:${s.brightnessRaw ?? ''}`).sort().join('|'));

let differs = 0;
for (const bi of cases) {
  const before = brightness(generateChart(bi));
  const xd2 = brightness(generateChart(bi, { brightnessSchool: 'XD2' }));
  const after = brightness(generateChart(bi));
  assert.deepEqual(after, before, `${bi.year}-${bi.month}-${bi.day}: 传 opts 后默认流派被改动`);

  // opts 与 setBrightnessSchool 结果一致
  setBrightnessSchool('XD2');
  const viaGlobal = brightness(generateChart(bi));
  // opts 优先于模块默认值
  const viaOptsDefault = brightness(generateChart(bi, { brightnessSchool: 'default' }));
  setBrightnessSchool('default');
  assert.deepEqual(viaGlobal, xd2, `${bi.year}-${bi.month}-${bi.day}: opts 与 setBrightnessSchool 结果不一致`);
  assert.deepEqual(viaOptsDefault, before, `${bi.year}-${bi.month}-${bi.day}: opts 未覆盖模块默认值`);

  if (JSON.stringify(xd2) !== JSON.stringify(before)) differs++;
}
// 防止用例全落在 QS / XD2 相同的格子里，上面的断言变成空转
assert.ok(differs > 0, '用例中 QS 与 XD2 亮度全部相同，换用例');

console.log(`brightness school option regression passed (${differs}/${cases.length} 例 QS≠XD2)`);
