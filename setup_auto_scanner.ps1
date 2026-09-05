# Viswah Hourly Auto Bug Scanner
# This script sets up an automated task to scan for bugs every hour

$ProjectRoot = "C:\Users\akara\Desktop\VISWAH\viswah-app"
$ScriptPath = "$ProjectRoot\auto_bug_scanner.py"

# Create the scheduled task action
$Action = New-ScheduledTaskAction -Execute "python" -Argument "`"$ScriptPath`"" -WorkingDirectory $ProjectRoot

# Create trigger - every hour
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)

# Register the task
Register-ScheduledTask -TaskName "ViswahBugScanner" -Action $Action -Trigger $Trigger -Description "Hourly bug scanner for Viswah app" -Force

Write-Host "Auto bug scanner scheduled successfully!"
Write-Host "Task will run every hour at: $ScriptPath"
Write-Host "Logs saved to: $ProjectRoot\bug_scan_log.txt"