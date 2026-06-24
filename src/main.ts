import { initApp } from './ui/app';

const root = document.getElementById('app');
if (root) {
  initApp(root).catch((err: Error) => {
    console.error(err);
    root.textContent = `エラー: ${err.message}`;
  });
}
