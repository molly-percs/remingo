' Starts the ReMingo local server with no visible window.
' Works from any location: it finds the "server" folder next to this script,
' so this file can be copied to another computer without editing any paths.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = fso.GetParentFolderName(scriptDir)

WshShell.CurrentDirectory = serverDir
WshShell.Run "cmd /c npm run dev", 0, False
