const path = require('path');
const { app, BrowserWindow } = require('electron');

let win;

function createWindow() {
  // יצירת חלון חדש בגודל 800x600 עם אייקון
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets', 'avudati.ico'), // 🔔 הגדרת אייקון לחלון
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // חשוב אם אתה משתמש בגרסאות חדשות
    }
  });

  // טוען את הקובץ הראשי
  win.loadFile('index.html');

  // סגירת חלון
  win.on('closed', () => {
    win = null;
  });
}

// כאשר האפליקציה מוכנה
app.whenReady().then(createWindow);

// סוגר אם כל החלונות סגורים (חוץ ממק)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// מפעיל מחדש אם לוחצים על האייקון בדוק
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
