const {app, BrowserWindow} = require('electron');

function createWindow(){
    const mainWindow = new BrowserWindow({
        height: 720,
        width: 565,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('nblock.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', ()=>{
    if(process.platform !== 'darwin'){
        app.quit();
    }
});

app.on('activate', ()=>{
    if(BrowserWindow.getAllWindows().length === 0){
        createWindow();
    }
})