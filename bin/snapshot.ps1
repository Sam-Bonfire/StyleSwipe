param(
    [string]$Type,
    [string]$Title,
    [string]$Description,
    [string]$Ticket
)

if (-not $Type -or -not $Title) {
    Write-Error "❌ Error: Missing commit type or title."
    Write-Host "Usage: mise run snap <type> <title> [-d description] [-t ticket]"
    exit 1
}

# Construct the title
$CommitMsg = "${Type}: ${Title}"

# Add optional description
if ($Description) {
    $CommitMsg = "${CommitMsg}`n`n${Description}"
}

# Add optional ticket ID
if ($Ticket) {
    $CommitMsg = "${CommitMsg}`n`nFor: ${Ticket}"
}

# Apply the commit
git add .
$CommitMsg | git commit -F -

Write-Host "Progress captured with structured message:"
Write-Host $CommitMsg
