// src/file-store.js
// 파일 기반 store 어댑터 — 엔진/서버가 주입하는 { load, save } 인터페이스의 실제 구현 예시.
//   순수 코어는 그대로 두고, 영속화(부수효과)만 이 경계로 격리한다.
//   (교육 메모: store.js 의 memoryStore 와 같은 모양. DB/localStorage 로 바꿔도 인터페이스는 동일.)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export function fileStore(path) {
  return {
    async load() {
      try {
        return JSON.parse(await readFile(path, 'utf8'));
      } catch {
        return null; // 파일 없음/깨짐 → null → loadState 가 초기 상태로 안전 폴백
      }
    },
    async save(state) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(state, null, 2), 'utf8');
    },
  };
}
