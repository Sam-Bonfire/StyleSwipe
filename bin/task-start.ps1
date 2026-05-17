param(
    [string]$Type,
    [string]$Title
)

if (-not $Type -or -not $Title) {
    Write-Error "❌ Error: Missing task type or title."
    Write-Host "Usage: mise run task <type> <title>"
    exit 1
}

# Slugify the title for the branch name
$SlugifiedTitle = $Title -replace '[^a-zA-Z0-9]+', '-' -replace '^-+|-+$', ''
$SlugifiedTitle = $SlugifiedTitle.ToLower()

# Safety check: Ensure we aren't branching directly off main
$CurrentBranch = git rev-parse --abbrev-ref HEAD
if ($CurrentBranch -eq "main") {
    Write-Warning "⚠️ Warning: You are branching off 'main'. Usually, you should branch off 'dev'."
    $Confirm = Read-Host "Continue anyway? (y/N)"
    if ($Confirm -notmatch '^[Yy]$') { exit 1 }
}

gt branch create "$Type/$SlugifiedTitle"
Write-Host "✅ Stacked new branch: $Type/$SlugifiedTitle"
