' Creates a shortcut in the Windows Startup folder that points at
' start-server-hidden.vbs, so the ReMingo server launches silently every
' time you log in. Safe to run more than once (just recreates the shortcut).
' Portable: computes the shortcut target from its own location, so this
' works unmodified after copying the project to another computer.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
launcherPath = scriptDir & "\start-server-hidden.vbs"
serverDir = fso.GetParentFolderName(scriptDir)

startupFolder = WshShell.SpecialFolders("Startup")
Set shortcut = WshShell.CreateShortcut(startupFolder & "\ReMingo Server.lnk")
shortcut.TargetPath = WshShell.ExpandEnvironmentStrings("%windir%\System32\wscript.exe")
shortcut.Arguments = """" & launcherPath & """"
shortcut.WorkingDirectory = serverDir
shortcut.Description = "Silently starts the ReMingo local server at login"
shortcut.Save

WScript.Echo "Autostart enabled. The ReMingo server will now start silently every time you log in." & vbCrLf & "Shortcut created at: " & startupFolder & "\ReMingo Server.lnk"
