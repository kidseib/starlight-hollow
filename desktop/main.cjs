const { app, BrowserWindow, net, protocol, session } = require('electron');
const { resolve, sep } = require('node:path');
const { pathToFileURL } = require('node:url');

const scheme = 'starlight';
const origin = `${scheme}://game`;
const root = resolve(__dirname, '../dist');
protocol.registerSchemesAsPrivileged([
  { scheme, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function openGame() {
  const window = new BrowserWindow({
    width: 1280, height: 800, minWidth: 640, minHeight: 480,
    backgroundColor: '#182144', autoHideMenuBar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadURL(`${origin}/index.html`).catch(error => { console.error(error); app.exit(1); });
}

app.whenReady().then(() => {
  protocol.handle(scheme, async request => {
    const url = new URL(request.url);
    if (url.hostname !== 'game' || request.method !== 'GET') return new Response(null, { status: 404 });
    let path;
    try { path = resolve(root, `.${decodeURIComponent(url.pathname)}`); }
    catch { return new Response(null, { status: 400 }); }
    if (!path.startsWith(root + sep)) return new Response(null, { status: 404 });
    return net.fetch(pathToFileURL(path).href);
  });
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_request, cb) => cb({ cancel: true }));
  openGame();
});
app.on('window-all-closed', () => app.quit());
