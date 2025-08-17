# PowerShell script to remove timeline functions from store.ts
$filePath = "C:\Users\aday\Desktop\Github\ArtBastard-DMX512\react-app\src\store\store.ts"
$content = Get-Content -Path $filePath

# Find the line numbers for the start and end of timeline functions
$startLine = $null
$endLine = $null

for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -like "*Timeline Sequence Management Actions*") {
        $startLine = $i
    }
    if ($startLine -ne $null -and $content[$i] -like "*// Autopilot Actions*") {
        $endLine = $i - 1
        break
    }
}

if ($startLine -ne $null -and $endLine -ne $null) {
    # Remove lines from startLine to endLine
    $newContent = @()
    $newContent += $content[0..($startLine-1)]
    $newContent += $content[($endLine+2)..($content.Length-1)]
    
    # Write back to file
    $newContent | Out-File -FilePath $filePath -Encoding UTF8
    
    Write-Host "Removed timeline functions from lines $startLine to $endLine"
} else {
    Write-Host "Could not find timeline function boundaries"
}
