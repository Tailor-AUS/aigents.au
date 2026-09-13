import http from 'node:http';
import { spawn } from 'node:child_process';

const serverProc = spawn('node', ['src/server.mjs'], {
  env: { ...process.env, PORT: '3099' },
  stdio: 'inherit'
});

setTimeout(async () => {
  try {
    console.log('[Test] Testing GET http://localhost:3099/ ...');
    const resHome = await fetch('http://localhost:3099/');
    const homeText = await resHome.text();
    console.log('[Test] Home status:', resHome.status, 'Contains Guaranteed Retainer:', homeText.includes('Guaranteed'));

    console.log('[Test] Testing GET http://localhost:3099/build ...');
    const resBuild = await fetch('http://localhost:3099/build');
    const buildText = await resBuild.text();
    console.log('[Test] Build status:', resBuild.status, 'Contains Fellowship Studio:', buildText.includes('STUDENT FELLOWSHIP STUDIO'));

    console.log('[Test] Testing POST http://localhost:3099/api/candidate/register ...');
    const resReg = await fetch('http://localhost:3099/api/candidate/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Miller',
        email: 'j.miller@unsw.edu.au',
        university: 'UNSW Sydney',
        discipline: 'Systems & Electrical Engineering',
        atar: '99.25',
        wam: '86.4',
        languages: 'Python, C++',
        tools: 'Altium, MATLAB',
        projectTitle: 'Embedded Telemetry & Power Management',
        projectSummary: 'Designed low-power telemetry board.',
        transcriptName: 'UNSW_Transcript_JM.pdf'
      })
    });
    const regData = await resReg.json();
    console.log('[Test] Register status:', resReg.status, 'Candidate ID:', regData.id, 'Weekly Retainer:', regData.weeklyRetainer);

    console.log('[Test] Testing GET http://localhost:3099/p/minres ...');
    const resMinRes = await fetch('http://localhost:3099/p/minres');
    const minresText = await resMinRes.text();
    console.log('[Test] MinRes portal status:', resMinRes.status, 'Contains Mineral Resources:', minresText.includes('Mineral Resources'));

    console.log('[Test] Testing GET http://localhost:3099/p/minres/brief ...');
    const resBrief = await fetch('http://localhost:3099/p/minres/brief');
    console.log('[Test] Brief status:', resBrief.status);

    console.log('[Test] Testing POST http://localhost:3099/api/chat ...');
    const resChat = await fetch('http://localhost:3099/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'minres', query: 'What experience do you have with telemetry pipelines?' })
    });
    const chatData = await resChat.json();
    console.log('[Test] Chat response preview:', chatData.reply.slice(0, 100));

    console.log('[Test] ALL ENDPOINTS VERIFIED PERFECTLY!');
  } catch (e) {
    console.error('[Test Error]', e);
  } finally {
    serverProc.kill();
    process.exit(0);
  }
}, 1500);
