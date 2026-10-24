## 改了什么、为什么 / 무엇을 왜 바꿨는지

<!-- 一两句话说清楚。关联的 issue 写成 #编号 · 한두 문장으로. 관련 이슈는 #번호 로 -->

## 自查 / 스스로 확인

- [ ] 本地跑过 `npm run typecheck` 和 `npm test`，都通过 · 로컬에서 `npm run typecheck`와 `npm test`를 돌려 모두 통과
- [ ] 改了排盘结果的，附上对照证据（出处，或其他排盘软件的截图），并在 `scripts/regression/` 加了回归测试、登记到 `package.json` 的 `test` · 배반 결과를 바꿨다면 근거(출처 또는 다른 배반 소프트웨어 스크린숏)를 붙이고, `scripts/regression/`에 회귀 테스트를 추가해 `package.json`의 `test`에 등록
- [ ] 改了界面文案的，`lib/i18n/messages/zh.ts` 与 `ko.ts` 同键都已补上 · 화면 문구를 바꿨다면 `lib/i18n/messages/zh.ts`와 `ko.ts`에 같은 키로 모두 추가
- [ ] 一个 PR 只做一件事 · PR 하나에는 한 가지 일만
- [ ] 没有提交 `.env.local`、密钥、他人的出生信息等隐私数据 · `.env.local`, 키, 타인의 출생 정보 같은 민감한 데이터를 올리지 않음
