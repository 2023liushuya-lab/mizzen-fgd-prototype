import { readdirSync, lstatSync, readFileSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allowed = ['src','public','tests','docs','scripts','README.md','AGENTS.md','package.json','pnpm-lock.yaml','tsconfig.json','next-env.d.ts','next.config.ts','postcss.config.mjs','vitest.config.ts','.prettierrc.json','.gitignore','启动原型.command','打包给研发.command'];
const files = [];
function collect(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`交接包不接受符号链接：${relative(root,path)}`);
  if (stat.isDirectory()) for (const name of readdirSync(path)) collect(join(path,name));
  else if (stat.isFile()) files.push(relative(root,path));
}
allowed.forEach(name => collect(join(root,name)));
const now = new Date();
const stamp = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now).replace(/[-: ]/g,'');
const outputDir = resolve(root,'../fgd-workbench-deliveries');
mkdirSync(outputDir,{recursive:true});
const output = join(outputDir,`FGD-原型源码-${stamp}-${now.getMilliseconds().toString().padStart(3,'0')}.zip`);
const temp = mkdtempSync(join(tmpdir(),'fgd-handoff-'));
try {
  const staged = join(temp,'fgd-workbench');
  const manifest = files.sort().map(file => {
    const target=join(staged,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,file),target);
    return {file,sha256:createHash('sha256').update(readFileSync(target)).digest('hex')};
  });
  const sourceCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const sourceBranch = execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
  writeFileSync(join(staged,'交接版本.json'),JSON.stringify({createdAt:now.toISOString(),sourceCommit,sourceBranch,repository:'https://github.com/2023liushuya-lab/mizzen-fgd-prototype',kind:'frontend-interaction-prototype',backend:'local-command-journal-mock',files:manifest},null,2));
  const archive = new JSZip();
  for (const file of [...files,'交接版本.json']) {
    const source=join(staged,file);
    archive.file('fgd-workbench/'+file,readFileSync(source),{unixPermissions:lstatSync(source).mode});
  }
  writeFileSync(output,await archive.generateAsync({type:'nodebuffer',compression:'DEFLATE',platform:'UNIX'}));
  execFileSync('/usr/bin/unzip',['-tq',output]);
  console.log(`交接包已生成：${output}`);
  console.log('包含源码、锁文件、文档与版本校验清单；不含依赖目录、构建缓存和浏览器演示数据。');
} finally { rmSync(temp,{recursive:true,force:true}); }
